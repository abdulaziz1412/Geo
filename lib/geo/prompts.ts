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
