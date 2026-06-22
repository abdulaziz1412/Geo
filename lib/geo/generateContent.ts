// lib/geo/generateContent.ts
// Generate GEO-optimized, citation-ready content for a target query, plus
// schema.org JSON-LD. Persists to generated_content and logs usage_events.
// Server-only (uses the Supabase service role). Mirrors runAudit conventions.

import { createClient } from "@supabase/supabase-js";
import { complete, parseJson, requireEnv } from "./llm";
import type { ProjectContext } from "./types";

export type ContentType = "faq" | "comparison" | "entity_rich" | "landing";

function admin() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } }
  );
}

const TYPE_BRIEF: Record<ContentType, string> = {
  faq: "an FAQ page: 6-10 buyer question/answer pairs, each answer 2-4 sentences, direct and quotable.",
  comparison: "a comparison page weighing the main options/criteria for this topic, with a short verdict and a comparison list.",
  entity_rich: "an entity-rich explainer densely referencing the real named entities (brands, places, standards, people) relevant to the topic.",
  landing: "a service/landing page that answers the topic and explains the offering, ending with a clear call to action.",
};

export interface GenerationResult {
  id: string;
  title: string;
  bodyMd: string;
  schemaJsonld: unknown;
}

export async function generateContent(
  projectId: string,
  opts: { type: ContentType; targetQuery: string }
): Promise<GenerationResult> {
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

  const sys =
    "You are a GEO (Generative Engine Optimization) content writer. You produce " +
    "content that AI assistants (ChatGPT, Gemini, Perplexity) can easily quote and " +
    "cite: a direct quotable answer up front, specific facts, clear headings, short " +
    "paragraphs, bullet lists and Q&A, rich in real named entities, following E-E-A-T. " +
    "Write in the project's language and the local dialect of its country.";

  const user = [
    `Business: ${ctx.businessName}`,
    ctx.domain ? `Website: ${ctx.domain}` : "",
    ctx.industry ? `Industry: ${ctx.industry}` : "",
    `Language (ISO-639-1): ${ctx.language}`,
    `Country (ISO-3166-1): ${ctx.country}`,
    `Target question/topic: ${opts.targetQuery}`,
    `Write ${TYPE_BRIEF[opts.type] ?? opts.type}`,
    "",
    "Rules:",
    "- Open with a direct, quotable answer in the first 1-2 sentences.",
    "- Use Markdown only for the body (headings, lists, Q&A). No HTML, no code fences.",
    "- Be specific and factual; mention the business naturally where it genuinely fits.",
    "- Produce valid schema.org JSON-LD: FAQPage for faq, otherwise Article.",
    "",
    'Return JSON only: {"title":"...","body_md":"...","schema_jsonld":{...}}',
  ]
    .filter(Boolean)
    .join("\n");

  const { text, tokensIn, tokensOut } = await complete(
    [
      { role: "system", content: sys },
      { role: "user", content: user },
    ],
    { json: true, maxTokens: 3000 }
  );

  const parsed = parseJson<{ title?: string; body_md?: string; schema_jsonld?: unknown }>(text);
  if (!parsed.body_md || !parsed.body_md.trim()) {
    throw new Error("Generation returned empty content");
  }

  const { data: row, error: insErr } = await db
    .from("generated_content")
    .insert({
      project_id: projectId,
      type: opts.type,
      target_query: opts.targetQuery,
      title: parsed.title || opts.targetQuery,
      body_md: parsed.body_md,
      schema_jsonld: parsed.schema_jsonld ?? null,
      language: ctx.language,
      status: "draft",
    })
    .select("id, title, body_md, schema_jsonld")
    .single();
  if (insErr || !row) throw new Error("Could not save generated content");

  // Approximate cost (OpenAI gpt-4o-mini rates) for COGS monitoring.
  const costUsd = tokensIn * 0.00000015 + tokensOut * 0.0000006;
  await db.from("usage_events").insert({
    org_id: ctx.orgId,
    kind: "generation",
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    cost_usd: Number(costUsd.toFixed(5)),
  });

  return {
    id: row.id,
    title: row.title,
    bodyMd: row.body_md,
    schemaJsonld: row.schema_jsonld,
  };
}
