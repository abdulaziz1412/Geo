// app/api/projects/route.ts — create a project (membership via RLS + plan limit).
import { type NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/guards";
import { supabaseServer } from "@/lib/supabase/server";
import { getOrgLimits } from "@/lib/plan";
import { json, errorJson, handleError, assertSameOrigin } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  org_id: z.string().uuid(),
  business_name: z.string().trim().min(1).max(120),
  domain: z.string().trim().max(200).optional().nullable(),
  industry: z.string().trim().max(120).optional().nullable(),
  language: z.string().trim().max(5).default("ar"),
  country: z.string().trim().max(2).default("SA"),
});

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    await requireUser();
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return errorJson("مدخلات غير صالحة", 422);
    const v = parsed.data;

    const sb = await supabaseServer();
    const { data: org } = await sb
      .from("organizations").select("id").eq("id", v.org_id).maybeSingle();
    if (!org) return errorJson("لا تملك صلاحية على هذه المؤسسة", 403);

    const limits = await getOrgLimits(v.org_id);
    const { count } = await sb
      .from("projects").select("*", { count: "exact", head: true }).eq("org_id", v.org_id);
    if ((count ?? 0) >= limits.max_projects) {
      return errorJson(`بلغت حدّ باقتك (${limits.max_projects} مشروع). رقِّ باقتك للمزيد.`, 403);
    }

    const { data: project, error } = await sb
      .from("projects")
      .insert({
        org_id: v.org_id,
        business_name: v.business_name,
        domain: v.domain ?? null,
        industry: v.industry ?? null,
        language: v.language,
        country: v.country,
      })
      .select("id")
      .single();
    if (error || !project) return errorJson("تعذّر إنشاء المشروع", 500);
    return json({ ok: true, id: project.id });
  } catch (e) {
    return handleError(e);
  }
}
