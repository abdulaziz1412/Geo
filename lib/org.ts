// lib/org.ts — resolve the signed-in user's primary organization (RLS-scoped).
import "server-only";
import { supabaseServer } from "@/lib/supabase/server";

export interface PrimaryOrg {
  id: string;
  name: string;
  plan: string;
}

export async function getPrimaryOrg(): Promise<PrimaryOrg | null> {
  const sb = await supabaseServer();
  const { data } = await sb
    .from("organizations")
    .select("id, name, plan")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (data as PrimaryOrg) ?? null;
}
