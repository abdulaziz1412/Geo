// app/admin/subscriptions/page.tsx
import { supabaseAdmin } from "@/lib/supabase/admin";
export const dynamic = "force-dynamic";

export default async function SubscriptionsPage() {
  const { data } = await supabaseAdmin().from("subscriptions")
    .select("id, status, plan, currency, current_period_end, created_at, organizations(name), plans(name)")
    .order("created_at", { ascending: false }).limit(200);
  const rows = (data ?? []) as any[];
  return (
    <section>
      <h1 className="admin-h1">الاشتراكات</h1>
      <table className="admin-table">
        <thead><tr><th>المؤسسة</th><th>الباقة</th><th>الحالة</th><th>ينتهي في</th></tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={4}>لا توجد اشتراكات.</td></tr>}
          {rows.map((s) => (
            <tr key={s.id}>
              <td>{s.organizations?.name ?? "—"}</td>
              <td>{s.plans?.name ?? s.plan}</td>
              <td><span className={`admin-badge admin-badge-${s.status}`}>{s.status}</span></td>
              <td>{s.current_period_end ? new Date(s.current_period_end).toLocaleDateString("ar-SA") : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
