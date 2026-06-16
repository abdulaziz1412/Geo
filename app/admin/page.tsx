// app/admin/page.tsx — back-office overview. Reads via service role AFTER the
// layout guard, so it can summarize service-role-only tables too.
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function count(table: string, filter?: (q: any) => any): Promise<number> {
  let q = supabaseAdmin().from(table).select("*", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count } = await q;
  return count ?? 0;
}

async function revenueThisMonth(): Promise<number> {
  const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
  const { data } = await supabaseAdmin().from("payments")
    .select("amount_cents").eq("status", "paid").gte("created_at", start.toISOString());
  return (data ?? []).reduce((s, p: any) => s + (p.amount_cents ?? 0), 0);
}

export default async function AdminHome() {
  const [activeSubs, paidPayments, openTickets, newMessages, waitlist, revenue] = await Promise.all([
    count("subscriptions", (q) => q.eq("status", "active")),
    count("payments", (q) => q.eq("status", "paid")),
    count("support_tickets", (q) => q.in("status", ["open", "pending"])),
    count("contact_messages", (q) => q.eq("status", "new")),
    count("waitlist_signups"),
    revenueThisMonth(),
  ]);
  const cards = [
    { label: "اشتراكات نشطة", value: activeSubs },
    { label: "إيراد هذا الشهر", value: `${(revenue / 100).toLocaleString("ar-SA")} ﷼` },
    { label: "مدفوعات مكتملة", value: paidPayments },
    { label: "تذاكر مفتوحة", value: openTickets },
    { label: "رسائل جديدة", value: newMessages },
    { label: "قائمة الانتظار", value: waitlist },
  ];
  return (
    <section>
      <h1 className="admin-h1">نظرة عامة</h1>
      <div className="admin-cards">
        {cards.map((c) => (
          <div key={c.label} className="admin-card">
            <div className="admin-card-value">{c.value}</div>
            <div className="admin-card-label">{c.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
