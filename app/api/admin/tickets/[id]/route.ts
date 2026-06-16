// app/api/admin/tickets/[id]/route.ts — staff reply + status change.
import { type NextRequest } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ticketAdminUpdateSchema } from "@/lib/validation";
import { json, errorJson, handleError, assertSameOrigin } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    const admin = await requirePlatformAdmin();
    const { id } = await ctx.params;
    const parsed = ticketAdminUpdateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return errorJson("مدخلات غير صالحة", 422);
    const db = supabaseAdmin();

    if (parsed.data.status) {
      await db.from("support_tickets").update({ status: parsed.data.status }).eq("id", id);
    }
    if (parsed.data.body) {
      // Service role → trigger marks the message is_staff = true.
      await db.from("ticket_messages").insert({ ticket_id: id, author_id: admin.id, body: parsed.data.body });
    }
    await db.from("admin_audit_log").insert({
      actor_id: admin.id, action: "ticket.update", target: id,
      metadata: { status: parsed.data.status ?? null, replied: Boolean(parsed.data.body) },
    });
    return json({ ok: true });
  } catch (e) { return handleError(e); }
}
