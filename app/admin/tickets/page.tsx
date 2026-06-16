// app/admin/tickets/page.tsx
import { supabaseAdmin } from "@/lib/supabase/admin";
export const dynamic = "force-dynamic";

export default async function TicketsPage() {
  const { data } = await supabaseAdmin().from("support_tickets")
    .select("id, subject, status, priority, updated_at, organizations(name)")
    .order("updated_at", { ascending: false }).limit(200);
  const rows = (data ?? []) as any[];
  return (
    <section>
      <h1 className="admin-h1">تذاكر الدعم الفني</h1>
      <table className="admin-table">
        <thead><tr><th>الموضوع</th><th>المؤسسة</th><th>الأولوية</th><th>الحالة</th><th>آخر تحديث</th></tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={5}>لا توجد تذاكر.</td></tr>}
          {rows.map((t) => (
            <tr key={t.id}>
              <td>{t.subject}</td>
              <td>{t.organizations?.name ?? "—"}</td>
              <td>{t.priority}</td>
              <td><span className={`admin-badge admin-badge-${t.status}`}>{t.status}</span></td>
              <td>{new Date(t.updated_at).toLocaleDateString("ar-SA")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
