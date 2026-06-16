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
