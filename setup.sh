#!/usr/bin/env bash
# =============================================================================
# GEO Platform — one-shot project setup
#
# Run this INSIDE a GitHub Codespace opened on your "Geo" repo:
#     bash setup.sh
#
# It scaffolds a Next.js project, installs dependencies, and writes every
# pipeline file. The database migration is already applied in Supabase, so it
# is NOT run here. The repo should be empty or contain only README/.gitignore.
# =============================================================================
set -e

echo "==> Scaffolding Next.js into a temp dir, then copying into the repo…"
# Scaffold in an empty temp dir (create-next-app refuses a non-empty dir),
# then copy everything up — this works even if the repo already has README,
# setup.sh, or .git.
TMP="/tmp/geo"
rm -rf "$TMP"
npx --yes create-next-app@latest "$TMP" \
  --typescript --tailwind --eslint --app --no-src-dir \
  --import-alias "@/*" --use-npm --yes
rm -rf "$TMP/.git"
cp -r "$TMP/." .
rm -rf "$TMP"

echo "==> Installing Supabase libraries…"
npm install @supabase/supabase-js @supabase/ssr

echo "==> Creating folders…"
mkdir -p lib/geo app/api/audit/run scripts

echo "==> Writing pipeline files…"

cat > lib/geo/types.ts << 'EOF'
// lib/geo/types.ts
// Shared types for the GEO audit pipeline.

export type EngineKey = string;

export interface ProjectContext {
  id: string;
  orgId: string;
  businessName: string;
  domain: string | null;
  industry: string | null;
  language: string; // ISO 639-1: 'ar', 'en', ...
  country: string; // ISO 3166-1: 'SA', 'AE', ...
}

export interface EngineResponse {
  text: string;
  citations: string[];
  modelUsed: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
}

export interface BrandHit {
  name: string;
  isTarget: boolean;
  firstPosition: number | null;
}

export interface AnalysisResult {
  mentioned: boolean;
  cited: boolean;
  position: number | null;
  competitors: string[];
  brands: BrandHit[];
}
EOF

cat > lib/geo/llm.ts << 'EOF'
// lib/geo/llm.ts
// Provider-agnostic LLM client for prompt generation and answer analysis.
// Choose provider with LLM_PROVIDER ('openai' | 'anthropic').

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

const PROVIDER = (process.env.LLM_PROVIDER ?? "openai").toLowerCase();

export interface LlmResult {
  text: string;
  tokensIn: number;
  tokensOut: number;
}

export async function complete(
  messages: ChatMessage[],
  opts: { json?: boolean; maxTokens?: number } = {}
): Promise<LlmResult> {
  if (PROVIDER === "anthropic") return anthropicComplete(messages, opts);
  return openaiComplete(messages, opts);
}

async function openaiComplete(
  messages: ChatMessage[],
  opts: { json?: boolean; maxTokens?: number }
): Promise<LlmResult> {
  const model = process.env.OPENAI_LLM_MODEL ?? "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${requireEnv("OPENAI_API_KEY")}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: opts.maxTokens ?? 1500,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return {
    text: data.choices?.[0]?.message?.content ?? "",
    tokensIn: data.usage?.prompt_tokens ?? 0,
    tokensOut: data.usage?.completion_tokens ?? 0,
  };
}

async function anthropicComplete(
  messages: ChatMessage[],
  opts: { json?: boolean; maxTokens?: number }
): Promise<LlmResult> {
  const model = process.env.ANTHROPIC_LLM_MODEL ?? "claude-sonnet-4-6";
  const sys = [
    ...messages.filter((m) => m.role === "system").map((m) => m.content),
    opts.json ? "Respond ONLY with valid JSON, no prose, no code fences." : "",
  ]
    .filter(Boolean)
    .join("\n");
  const rest = messages.filter((m) => m.role !== "system");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": requireEnv("ANTHROPIC_API_KEY"),
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: opts.maxTokens ?? 1500,
      ...(sys ? { system: sys } : {}),
      messages: rest.map((m) => ({ role: m.role, content: m.content })),
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = (data.content ?? [])
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("");
  return {
    text,
    tokensIn: data.usage?.input_tokens ?? 0,
    tokensOut: data.usage?.output_tokens ?? 0,
  };
}

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export function parseJson<T>(text: string): T {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const slice = start >= 0 && end >= 0 ? cleaned.slice(start, end + 1) : cleaned;
  return JSON.parse(slice) as T;
}
EOF

cat > lib/geo/prompts.ts << 'EOF'
// lib/geo/prompts.ts
// Generate localized bottom-funnel buyer questions for a project.

import { complete, parseJson } from "./llm";
import type { ProjectContext } from "./types";

export interface GeneratedPrompt {
  text: string;
  intent: string;
}

export async function generatePrompts(
  project: ProjectContext,
  count = 20
): Promise<GeneratedPrompt[]> {
  const sys =
    "You design realistic search-style questions that buyers type into AI " +
    "assistants (ChatGPT, Gemini, Perplexity) when researching a purchase. " +
    "You write them in the project's language and local dialect, exactly the " +
    "way a real customer in that country would phrase them.";

  const user = [
    `Business: ${project.businessName}`,
    project.domain ? `Website: ${project.domain}` : "",
    project.industry ? `Industry: ${project.industry}` : "",
    `Language (ISO-639-1): ${project.language}`,
    `Country (ISO-3166-1): ${project.country}`,
    "",
    `Produce ${count} questions a potential customer would ask an AI assistant`,
    "about this CATEGORY — not about this brand by name. Bias toward",
    "bottom-funnel, purchase-intent and comparison questions (best X,",
    "X vs Y, recommended X for <use case>, cheapest reliable X, ...).",
    "",
    'Return JSON only: {"prompts":[{"text":"...","intent":"bottom_funnel|comparison|informational"}]}',
  ]
    .filter(Boolean)
    .join("\n");

  const { text } = await complete(
    [
      { role: "system", content: sys },
      { role: "user", content: user },
    ],
    { json: true, maxTokens: 2000 }
  );

  const parsed = parseJson<{ prompts: GeneratedPrompt[] }>(text);
  return (parsed.prompts ?? []).filter((p) => p.text?.trim());
}
EOF

cat > lib/geo/engines.ts << 'EOF'
// lib/geo/engines.ts
// Adapters that query each AI engine for one question and return the answer
// plus any citations. Endpoints/models are env-configurable. Confirm provider
// request/response shapes against current docs and tweak the mappers if needed.

import { requireEnv } from "./llm";
import type { EngineKey, EngineResponse, ProjectContext } from "./types";

const DEFAULT_PRICES: Record<string, { in: number; out: number }> = {
  perplexity: { in: 1, out: 1 },
  openai_web: { in: 2.5, out: 10 },
  gemini_grounded: { in: 1.25, out: 5 },
  jais: { in: 0.5, out: 1.5 },
  falcon: { in: 0.5, out: 1.5 },
};

function priceFor(key: string) {
  try {
    const o = JSON.parse(process.env.ENGINE_PRICES ?? "{}");
    if (o[key]) return o[key];
  } catch {
    /* ignore malformed override */
  }
  return DEFAULT_PRICES[key] ?? { in: 1, out: 1 };
}

function cost(key: string, tin: number, tout: number) {
  const p = priceFor(key);
  return (tin / 1e6) * p.in + (tout / 1e6) * p.out;
}

function localeSystem(project: ProjectContext): string {
  return (
    `Answer in ${project.language}. You are a helpful assistant for users ` +
    `in country ${project.country}. Be concise and cite sources when you can.`
  );
}

type EngineFn = (question: string, project: ProjectContext) => Promise<EngineResponse>;

async function openAICompatible(
  key: EngineKey,
  baseUrl: string,
  apiKey: string,
  model: string,
  question: string,
  project: ProjectContext
): Promise<EngineResponse> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: localeSystem(project) },
        { role: "user", content: question },
      ],
      max_tokens: 1200,
    }),
  });
  if (!res.ok) throw new Error(`${key} ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  const citations: string[] = Array.isArray(data.citations) ? data.citations : [];
  const tin = data.usage?.prompt_tokens ?? 0;
  const tout = data.usage?.completion_tokens ?? 0;
  return { text, citations, modelUsed: model, tokensIn: tin, tokensOut: tout, costUsd: cost(key, tin, tout) };
}

const perplexity: EngineFn = (q, p) =>
  openAICompatible(
    "perplexity",
    process.env.PERPLEXITY_BASE_URL ?? "https://api.perplexity.ai",
    requireEnv("PERPLEXITY_API_KEY"),
    process.env.PERPLEXITY_MODEL ?? "sonar",
    q,
    p
  );

const jais: EngineFn = (q, p) =>
  openAICompatible(
    "jais",
    requireEnv("JAIS_BASE_URL"),
    requireEnv("JAIS_API_KEY"),
    process.env.JAIS_MODEL ?? "jais",
    q,
    p
  );

const falcon: EngineFn = (q, p) =>
  openAICompatible(
    "falcon",
    requireEnv("FALCON_BASE_URL"),
    requireEnv("FALCON_API_KEY"),
    process.env.FALCON_MODEL ?? "falcon",
    q,
    p
  );

const openaiWeb: EngineFn = async (q, p) => {
  const model = process.env.OPENAI_WEB_MODEL ?? "gpt-4o";
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${requireEnv("OPENAI_API_KEY")}`,
    },
    body: JSON.stringify({
      model,
      tools: [{ type: "web_search" }],
      input: `${localeSystem(p)}\n\nQuestion: ${q}`,
    }),
  });
  if (!res.ok) throw new Error(`openai_web ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const { text, citations } = extractResponsesOutput(data);
  const tin = data.usage?.input_tokens ?? 0;
  const tout = data.usage?.output_tokens ?? 0;
  return { text, citations, modelUsed: model, tokensIn: tin, tokensOut: tout, costUsd: cost("openai_web", tin, tout) };
};

function extractResponsesOutput(data: any): { text: string; citations: string[] } {
  let text: string = data.output_text ?? "";
  const citations = new Set<string>();
  for (const item of data.output ?? []) {
    for (const c of item.content ?? []) {
      if (c.type === "output_text") {
        if (!text) text += c.text ?? "";
        for (const a of c.annotations ?? []) {
          if (a.url) citations.add(a.url);
        }
      }
    }
  }
  return { text, citations: [...citations] };
}

const geminiGrounded: EngineFn = async (q, p) => {
  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
  const key = requireEnv("GEMINI_API_KEY");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: localeSystem(p) }] },
      contents: [{ role: "user", parts: [{ text: q }] }],
      tools: [{ google_search: {} }],
    }),
  });
  if (!res.ok) throw new Error(`gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const cand = data.candidates?.[0];
  const text = (cand?.content?.parts ?? []).map((pt: any) => pt.text ?? "").join("");
  const citations: string[] = (cand?.groundingMetadata?.groundingChunks ?? [])
    .map((c: any) => c.web?.uri)
    .filter(Boolean);
  const tin = data.usageMetadata?.promptTokenCount ?? 0;
  const tout = data.usageMetadata?.candidatesTokenCount ?? 0;
  return { text, citations, modelUsed: model, tokensIn: tin, tokensOut: tout, costUsd: cost("gemini_grounded", tin, tout) };
};

export const ENGINES: Record<string, EngineFn> = {
  perplexity,
  openai_web: openaiWeb,
  gemini_grounded: geminiGrounded,
  jais,
  falcon,
};

export async function queryEngine(
  key: EngineKey,
  question: string,
  project: ProjectContext
): Promise<EngineResponse> {
  const fn = ENGINES[key];
  if (!fn) throw new Error(`No adapter registered for engine '${key}'`);
  return fn(question, project);
}
EOF

cat > lib/geo/analyze.ts << 'EOF'
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
EOF

cat > lib/geo/runAudit.ts << 'EOF'
// lib/geo/runAudit.ts
// Orchestrates a full audit: load prompts + engines, query each
// (prompt x engine) several times, analyze, persist results and cost,
// then aggregate. Uses the Supabase service role (server-only).

import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "./llm";
import { generatePrompts } from "./prompts";
import { queryEngine } from "./engines";
import { analyzeAnswer, shareOfVoice } from "./analyze";
import type { ProjectContext } from "./types";

function admin() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } }
  );
}

async function pool<T, R>(items: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return out;
}

export async function runAudit(
  projectId: string
): Promise<{ runId: string; shareOfVoice: number; samples: number }> {
  const db = admin();

  const { data: project, error: pErr } = await db
    .from("projects")
    .select("id, org_id, business_name, domain, industry, language, country")
    .eq("id", projectId)
    .single();
  if (pErr || !project) throw new Error(`Project not found: ${projectId}`);

  const ctx: ProjectContext = {
    id: project.id,
    orgId: project.org_id,
    businessName: project.business_name,
    domain: project.domain,
    industry: project.industry,
    language: project.language,
    country: project.country,
  };

  let { data: prompts } = await db
    .from("prompts")
    .select("id, text")
    .eq("project_id", projectId)
    .eq("is_active", true);

  if (!prompts || prompts.length === 0) {
    const generated = await generatePrompts(ctx);
    const { data: inserted } = await db
      .from("prompts")
      .insert(
        generated.map((g) => ({
          project_id: projectId,
          text: g.text,
          intent: g.intent,
          source: "ai_generated",
        }))
      )
      .select("id, text");
    prompts = inserted ?? [];
  }

  const { data: engines } = await db
    .from("engines")
    .select("id, key, languages")
    .eq("is_active", true);
  const applicable = (engines ?? []).filter(
    (e) => !e.languages || (e.languages as string[]).includes(ctx.language)
  );

  const samples = Number(process.env.AUDIT_SAMPLES ?? 3);
  const { data: run, error: rErr } = await db
    .from("audit_runs")
    .insert({
      project_id: projectId,
      status: "running",
      trigger: "manual",
      samples,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (rErr || !run) throw new Error("Could not create audit run");

  type Job = {
    promptId: string;
    question: string;
    engineId: string;
    engineKey: string;
    sampleIndex: number;
  };
  const jobs: Job[] = [];
  for (const p of prompts) {
    for (const e of applicable) {
      for (let s = 0; s < samples; s++) {
        jobs.push({ promptId: p.id, question: p.text, engineId: e.id, engineKey: e.key, sampleIndex: s });
      }
    }
  }

  const concurrency = Number(process.env.AUDIT_CONCURRENCY ?? 4);
  const results = await pool(jobs, concurrency, async (job) => {
    try {
      const resp = await queryEngine(job.engineKey, job.question, ctx);
      const analysis = await analyzeAnswer(ctx, resp.text, resp.citations);

      await db.from("audit_results").insert({
        run_id: run.id,
        prompt_id: job.promptId,
        engine_id: job.engineId,
        sample_index: job.sampleIndex,
        mentioned: analysis.mentioned,
        cited: analysis.cited,
        position: analysis.position,
        competitors: analysis.competitors,
        citations: resp.citations,
        model_used: resp.modelUsed,
        raw_response: resp.text,
      });

      await db.from("usage_events").insert({
        org_id: ctx.orgId,
        kind: "audit",
        engine_id: job.engineId,
        tokens_in: resp.tokensIn,
        tokens_out: resp.tokensOut,
        cost_usd: resp.costUsd,
      });

      return { mentioned: analysis.mentioned };
    } catch (err) {
      console.error(`[audit] ${job.engineKey} failed for prompt ${job.promptId}:`, err);
      return { mentioned: false };
    }
  });

  const sov = shareOfVoice(results.map((r) => ({ mentioned: r.mentioned })));
  await db
    .from("audit_runs")
    .update({ status: "completed", finished_at: new Date().toISOString() })
    .eq("id", run.id);

  return { runId: run.id, shareOfVoice: sov, samples };
}
EOF

cat > app/api/audit/run/route.ts << 'EOF'
// app/api/audit/run/route.ts
// POST { projectId } -> runs an audit after verifying the caller's session.
// For scale, move runAudit into a background job; inline run is fine for MVP.

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { runAudit } from "@/lib/geo/runAudit";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const { projectId } = await req.json().catch(() => ({}));
  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .single();
  if (!project) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const result = await runAudit(projectId);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[audit] run failed:", err);
    return NextResponse.json({ error: err?.message ?? "audit failed" }, { status: 500 });
  }
}
EOF

cat > scripts/test-audit.ts << 'EOF'
// scripts/test-audit.ts
// Quick pipeline test. Run from the project root:
//   npx tsx --env-file=.env.local scripts/test-audit.ts
import { runAudit } from "../lib/geo/runAudit";

const projectId = process.argv[2] ?? "<project-id>";
runAudit(projectId).then(console.log).catch(console.error);
EOF

cat > .env.example << 'EOF'
# --- Supabase ---
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# --- Internal LLM (prompt generation + answer analysis) ---
LLM_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_LLM_MODEL=gpt-4o-mini
ANTHROPIC_API_KEY=
ANTHROPIC_LLM_MODEL=claude-sonnet-4-6

# --- Audited engines ---
PERPLEXITY_API_KEY=
PERPLEXITY_MODEL=sonar
OPENAI_WEB_MODEL=gpt-4o
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash

# --- Regional Arabic models ---
JAIS_BASE_URL=
JAIS_API_KEY=
JAIS_MODEL=jais
FALCON_BASE_URL=
FALCON_API_KEY=
FALCON_MODEL=falcon

# --- Pipeline tuning ---
AUDIT_SAMPLES=3
AUDIT_CONCURRENCY=4
EOF

echo ""
echo "============================================================"
echo "  Done. Project scaffolded and pipeline files written."
echo ""
echo "  Next:"
echo "   1) cp .env.example .env.local   then fill in your keys"
echo "   2) Source Control panel -> Commit -> Push (publishes to GitHub)"
echo "   3) On vercel.com: import the repo, add the same env vars"
echo "============================================================"
