// app/admin/messages/page.tsx — contact messages + waitlist signups.
import { supabaseAdmin } from "@/lib/supabase/admin";
export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const db = supabaseAdmin();
  const [{ data: messages }, { data: waitlist }] = await Promise.all([
    db.from("contact_messages").select("id, name, email, message, status, created_at").order("created_at", { ascending: false }).limit(200),
    db.from("waitlist_signups").select("id, email, source, created_at").order("created_at", { ascending: false }).limit(200),
  ]);
  const msgs = (messages ?? []) as any[];
  const wl = (waitlist ?? []) as any[];
  return (
    <section>
      <h1 className="admin-h1">رسائل التواصل</h1>
      <table className="admin-table">
        <thead><tr><th>التاريخ</th><th>الاسم</th><th>البريد</th><th>الرسالة</th><th>الحالة</th></tr></thead>
        <tbody>
          {msgs.length === 0 && <tr><td colSpan={5}>لا توجد رسائل.</td></tr>}
          {msgs.map((m) => (
            <tr key={m.id}>
              <td>{new Date(m.created_at).toLocaleDateString("ar-SA")}</td>
              <td>{m.name}</td><td dir="ltr">{m.email}</td>
              <td className="admin-truncate">{m.message}</td><td>{m.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2 className="admin-h2">قائمة الانتظار ({wl.length})</h2>
      <table className="admin-table">
        <thead><tr><th>التاريخ</th><th>البريد</th><th>المصدر</th></tr></thead>
        <tbody>
          {wl.length === 0 && <tr><td colSpan={3}>لا أحد بعد.</td></tr>}
          {wl.map((w) => (
            <tr key={w.id}>
              <td>{new Date(w.created_at).toLocaleDateString("ar-SA")}</td>
              <td dir="ltr">{w.email}</td><td>{w.source ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
