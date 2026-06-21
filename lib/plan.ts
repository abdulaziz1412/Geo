// lib/plan.ts — read an org's plan tier + entitlement limits from the catalogue.
// Degrades to free-tier defaults if the plans table/row isn't present yet.
import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

export interface OrgLimits {
  planTier: string;
  max_projects: number;
  max_prompts: number;
  audits_per_month: number;
}

export async function getOrgLimits(orgId: string): Promise<OrgLimits> {
  const db = supabaseAdmin();
  let tier = "free";
  try {
    const { data: org } = await db
      .from("organizations").select("plan").eq("id", orgId).maybeSingle();
    if (org?.plan) tier = String(org.plan);
  } catch {
    /* fall through to defaults */
  }

  let limits: Record<string, unknown> = {};
  try {
    const { data: plan } = await db
      .from("plans").select("limits").eq("tier", tier).eq("is_active", true).maybeSingle();
    if (plan?.limits && typeof plan.limits === "object") {
      limits = plan.limits as Record<string, unknown>;
    }
  } catch {
    /* plans table may not exist yet */
  }

  const num = (v: unknown, d: number) => (typeof v === "number" ? v : Number(v) || d);
  return {
    planTier: tier,
    max_projects: num(limits.max_projects, 1),
    max_prompts: num(limits.max_prompts, 10),
    audits_per_month: num(limits.audits_per_month, 1),
  };
}
