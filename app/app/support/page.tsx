// app/app/support/page.tsx — customer support tickets.
import { getPrimaryOrg } from "@/lib/org";
import { supabaseServer } from "@/lib/supabase/server";
import SupportPanel from "./SupportPanel";

export const dynamic = "force-dynamic";

interface TicketRow { id: string; subject: string; status: string; updated_at: string; }

export default async function SupportPage() {
  const org = await getPrimaryOrg();
  if (!org) {
    return <section><h1 className="admin-h1">الدعم</h1><p className="admin-note">لا توجد مؤسسة.</p></section>;
  }
  const sb = await supabaseServer();
  const { data } = await sb
    .from("support_tickets").select("id, subject, status, updated_at")
    .eq("org_id", org.id).order("updated_at", { ascending: false });
  const tickets = (data ?? []) as TicketRow[];

  return (
    <section>
      <h1 className="admin-h1">الدعم الفني</h1>
      <SupportPanel orgId={org.id} tickets={tickets} />
    </section>
  );
}
