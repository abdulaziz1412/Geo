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
