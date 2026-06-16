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
