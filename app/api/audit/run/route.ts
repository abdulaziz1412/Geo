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
