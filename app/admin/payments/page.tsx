// app/admin/payments/page.tsx
import { supabaseAdmin } from "@/lib/supabase/admin";
export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const { data } = await supabaseAdmin().from("payments")
    .select("id, amount_cents, currency, status, provider, description, created_at, organizations(name)")
    .order("created_at", { ascending: false }).limit(200);
  const rows = (data ?? []) as any[];
  return (
    <section>
      <h1 className="admin-h1">المدفوعات والطلبات</h1>
      <table className="admin-table">
        <thead><tr><th>التاريخ</th><th>المؤسسة</th><th>الوصف</th><th>المبلغ</th><th>المزوّد</th><th>الحالة</th></tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={6}>لا توجد مدفوعات.</td></tr>}
          {rows.map((p) => (
            <tr key={p.id}>
              <td>{new Date(p.created_at).toLocaleDateString("ar-SA")}</td>
              <td>{p.organizations?.name ?? "—"}</td>
              <td>{p.description ?? "—"}</td>
              <td>{(p.amount_cents / 100).toLocaleString("ar-SA")} {p.currency}</td>
              <td>{p.provider}</td>
              <td><span className={`admin-badge admin-badge-${p.status}`}>{p.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
