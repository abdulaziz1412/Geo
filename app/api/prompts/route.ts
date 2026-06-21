// app/api/prompts/route.ts — add a prompt to a project (membership via RLS + plan limit).
import { type NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/guards";
import { supabaseServer } from "@/lib/supabase/server";
import { getOrgLimits } from "@/lib/plan";
import { json, errorJson, handleError, assertSameOrigin } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  project_id: z.string().uuid(),
  text: z.string().trim().min(1).max(500),
  intent: z.string().trim().max(60).optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    await requireUser();
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return errorJson("مدخلات غير صالحة", 422);
    const v = parsed.data;

    const sb = await supabaseServer();
    const { data: project } = await sb
      .from("projects").select("id, org_id").eq("id", v.project_id).maybeSingle();
    if (!project) return errorJson("لا تملك صلاحية على هذا المشروع", 403);

    const limits = await getOrgLimits(project.org_id as string);
    const { data: projs } = await sb
      .from("projects").select("id").eq("org_id", project.org_id as string);
    const ids = (projs ?? []).map((p) => p.id as string);
    const { count } = await sb
      .from("prompts").select("*", { count: "exact", head: true }).in("project_id", ids);
    if ((count ?? 0) >= limits.max_prompts) {
      return errorJson(`بلغت حدّ الأسئلة في باقتك (${limits.max_prompts}). رقِّ باقتك للمزيد.`, 403);
    }

    const { error } = await sb
      .from("prompts")
      .insert({ project_id: v.project_id, text: v.text, intent: v.intent ?? null, source: "manual" });
    if (error) return errorJson("تعذّرت إضافة السؤال", 500);
    return json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
