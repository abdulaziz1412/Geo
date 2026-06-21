"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface TicketRow { id: string; subject: string; status: string; updated_at: string; }

export default function SupportPanel(
  { orgId, tickets }: { orgId: string; tickets: TicketRow[] },
) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function create() {
    setBusy(true); setMsg(null);
    const res = await fetch("/api/tickets", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ org_id: orgId, subject, body }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setMsg(data.error ?? "تعذّر الإرسال"); return; }
    setSubject(""); setBody(""); setMsg("تم إنشاء التذكرة ✅"); router.refresh();
  }

  return (
    <div>
      <h2 className="admin-h2">تذاكرك</h2>
      <table className="admin-table">
        <thead><tr><th>الموضوع</th><th>الحالة</th><th>آخر تحديث</th></tr></thead>
        <tbody>
          {tickets.length === 0 && <tr><td colSpan={3}>لا تذاكر بعد.</td></tr>}
          {tickets.map((t) => (
            <tr key={t.id}>
              <td>{t.subject}</td>
              <td><span className={`admin-badge admin-badge-${t.status}`}>{t.status}</span></td>
              <td>{new Date(t.updated_at).toLocaleDateString("ar-SA")}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="admin-h2">تذكرة جديدة</h2>
      <div className="admin-form" style={{ maxWidth: 720 }}>
        <label>الموضوع<input value={subject} onChange={(e) => setSubject(e.target.value)} /></label>
        <label>الرسالة
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4}
            style={{ padding: "10px 12px", border: "1px solid var(--geo-line)", borderRadius: 10, font: "inherit", background: "#fbfaf6" }} />
        </label>
        <button className="btn btn-primary" onClick={create} disabled={busy || !subject || !body}>{busy ? "…" : "إرسال"}</button>
        {msg && <p className="admin-msg">{msg}</p>}
      </div>
    </div>
  );
}
