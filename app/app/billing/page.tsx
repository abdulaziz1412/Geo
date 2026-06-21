// app/app/billing/page.tsx — current plan + invoices (RLS-scoped).
import Link from "next/link";
import { getPrimaryOrg } from "@/lib/org";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const PLAN_NAMES: Record<string, string> = {
  free: "مجاني", starter: "المبتدئ", pro: "الاحترافي", agency: "الوكالات",
};

interface InvoiceRow { number: string; amount_cents: number; currency: string; status: string; issued_at: string; }

export default async function BillingPage() {
  const org = await getPrimaryOrg();
  if (!org) {
    return <section><h1 className="admin-h1">الاشتراك</h1><p className="admin-note">لا توجد مؤسسة.</p></section>;
  }
  const sb = await supabaseServer();
  const { data: sub } = await sb
    .from("subscriptions").select("status, current_period_end").eq("org_id", org.id).maybeSingle();
  const { data } = await sb
    .from("invoices").select("number, amount_cents, currency, status, issued_at")
    .eq("org_id", org.id).order("issued_at", { ascending: false }).limit(20);
  const invoices = (data ?? []) as InvoiceRow[];

  return (
    <section>
      <h1 className="admin-h1">الاشتراك والفواتير</h1>
      <div className="admin-cards">
        <div className="admin-card">
          <div className="admin-card-value">{PLAN_NAMES[org.plan] ?? org.plan}</div>
          <div className="admin-card-label">الباقة الحالية</div>
        </div>
        <div className="admin-card">
          <div className="admin-card-value">{sub?.status ?? "—"}</div>
          <div className="admin-card-label">حالة الاشتراك</div>
        </div>
        <div className="admin-card" style={{ display: "flex", alignItems: "center" }}>
          <Link href="/pricing" className="btn btn-primary">تغيير الباقة</Link>
        </div>
      </div>

      <h2 className="admin-h2">الفواتير</h2>
      <table className="admin-table">
        <thead><tr><th>الرقم</th><th>المبلغ</th><th>الحالة</th><th>التاريخ</th></tr></thead>
        <tbody>
          {invoices.length === 0 && <tr><td colSpan={4}>لا فواتير بعد.</td></tr>}
          {invoices.map((i) => (
            <tr key={i.number}>
              <td dir="ltr">{i.number}</td>
              <td>{(i.amount_cents / 100).toLocaleString("ar-SA")} {i.currency}</td>
              <td>{i.status}</td>
              <td>{new Date(i.issued_at).toLocaleDateString("ar-SA")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
