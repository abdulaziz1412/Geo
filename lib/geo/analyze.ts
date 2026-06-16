// lib/geo/analyze.ts
// Decide, for one engine answer: mentioned? cited? position? competitors?
// Mention/competitor detection uses the LLM (Arabic-aware); "cited" is a
// deterministic check of the target domain against the citation URLs.

import { complete, parseJson } from "./llm";
import type { AnalysisResult, ProjectContext } from "./types";

interface RawAnalysis {
  target_mentioned: boolean;
  target_position: number | null;
  competitors: string[];
}

export async function analyzeAnswer(
  project: ProjectContext,
  answer: string,
  citations: string[]
): Promise<AnalysisResult> {
  const sys =
    "You analyze an AI assistant's answer to decide whether a specific brand " +
    "was recommended/mentioned and which competing brands appeared. Judge by " +
    "meaning, not exact spelling (handle transliteration and morphology).";

  const user = [
    `Target brand: ${project.businessName}` + (project.domain ? ` (${project.domain})` : ""),
    "",
    "Answer to analyze:",
    '"""',
    answer.slice(0, 6000),
    '"""',
    "",
    "Return JSON only:",
    '{"target_mentioned": boolean, "target_position": integer|null,',
    ' "competitors": ["brand", ...]}',
    "target_position = 1-based order of the target among all brands named",
    "(null if not mentioned). competitors = other brands/companies named.",
  ].join("\n");

  let raw: RawAnalysis;
  try {
    const { text } = await complete(
      [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      { json: true, maxTokens: 600 }
    );
    raw = parseJson<RawAnalysis>(text);
  } catch {
    raw = { target_mentioned: false, target_position: null, competitors: [] };
  }

  const cited = isDomainCited(project.domain, citations);
  const competitors = (raw.competitors ?? []).filter(Boolean);
  const brands = [
    ...(raw.target_mentioned
      ? [{ name: project.businessName, isTarget: true, firstPosition: raw.target_position }]
      : []),
    ...competitors.map((name) => ({ name, isTarget: false, firstPosition: null })),
  ];

  return {
    mentioned: !!raw.target_mentioned,
    cited,
    position: raw.target_position ?? null,
    competitors,
    brands,
  };
}

function isDomainCited(domain: string | null, citations: string[]): boolean {
  if (!domain) return false;
  const host = domain
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .toLowerCase();
  return citations.some((u) => {
    try {
      return new URL(u).hostname.replace(/^www\./, "").toLowerCase().endsWith(host);
    } catch {
      return u.toLowerCase().includes(host);
    }
  });
}

export function shareOfVoice(samples: { mentioned: boolean }[]): number {
  if (samples.length === 0) return 0;
  const hits = samples.filter((s) => s.mentioned).length;
  return Math.round((hits / samples.length) * 10000) / 100;
}
