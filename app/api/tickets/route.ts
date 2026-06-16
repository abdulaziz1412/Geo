// app/api/tickets/route.ts — user side. RLS enforces org membership; the
// is_staff flag is set authoritatively by a DB trigger, not the client.
import { type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { supabaseServer } from "@/lib/supabase/server";
import { ticketSchema, ticketReplySchema } from "@/lib/validation";
import { json, errorJson, handleError, assertSameOrigin } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const user = await requireUser();
    const parsed = ticketSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return errorJson("مدخلات غير صالحة", 422);
    const { org_id, subject, body, priority } = parsed.data;

    const sb = await supabaseServer();
    const { data: ticket, error } = await sb.from("support_tickets")
      .insert({ org_id, created_by: user.id, subject, priority }).select("id").single();
    if (error || !ticket) return errorJson("تعذّر إنشاء التذكرة (تحقّق من صلاحيتك على المؤسسة)", 403);

    const { error: msgErr } = await sb.from("ticket_messages")
      .insert({ ticket_id: ticket.id, author_id: user.id, body });
    if (msgErr) throw msgErr;
    return json({ ok: true, ticket_id: ticket.id });
  } catch (e) { return handleError(e); }
}

export async function PATCH(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const user = await requireUser();
    const parsed = ticketReplySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return errorJson("مدخلات غير صالحة", 422);

    const sb = await supabaseServer();
    const { error } = await sb.from("ticket_messages")
      .insert({ ticket_id: parsed.data.ticket_id, author_id: user.id, body: parsed.data.body });
    if (error) return errorJson("تعذّر إرسال الرد", 403);
    return json({ ok: true });
  } catch (e) { return handleError(e); }
}
