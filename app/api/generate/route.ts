// app/api/generate/route.ts
// POST { projectId, type, targetQuery } -> generates GEO content after
// verifying the caller owns the project (RLS via the user's session).

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { generateContent } from "@/lib/geo/generateContent";

export const maxDuration = 300;

const TYPES = ["faq", "comparison", "entity_rich", "landing"] as const;
type ContentType = (typeof TYPES)[number];

export async function POST(req: NextRequest) {
  const { projectId, type, targetQuery } = await req.json().catch(() => ({}));
  if (!projectId || !targetQuery || !TYPES.includes(type)) {
    return NextResponse.json(
      { error: "projectId, targetQuery, and a valid type are required" },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .single();
  if (!project) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  try {
    const result = await generateContent(projectId, {
      type: type as ContentType,
      targetQuery,
    });
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[generate] failed:", err);
    return NextResponse.json({ error: err?.message ?? "generation failed" }, { status: 500 });
  }
}
