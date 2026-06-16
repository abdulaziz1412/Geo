// app/api/admin/plans/route.ts — staff edit the plan catalogue.
import { type NextRequest } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { planUpsertSchema } from "@/lib/validation";
import { json, errorJson, handleError, assertSameOrigin } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const admin = await requirePlatformAdmin();
    const parsed = planUpsertSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return errorJson(parsed.error.issues[0]?.message ?? "مدخلات غير صالحة", 422);
    const db = supabaseAdmin();
    const { error } = await db.from("plans").upsert(parsed.data, { onConflict: "code" });
    if (error) throw error;
    await db.from("admin_audit_log").insert({
      actor_id: admin.id, action: "plan.upsert", target: parsed.data.code,
    });
    return json({ ok: true });
  } catch (e) { return handleError(e); }
}
