"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProjectPanel(
  { projectId, prompts, hasPrompts }:
  { projectId: string; prompts: { id: string; text: string }[]; hasPrompts: boolean },
) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [adding, setAdding] = useState(false);
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function addPrompt() {
    setAdding(true); setMsg(null);
    const res = await fetch("/api/prompts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId, text }),
    });
    const data = await res.json().catch(() => ({}));
    setAdding(false);
    if (!res.ok) { setMsg(data.error ?? "تعذّرت الإضافة"); return; }
    setText(""); router.refresh();
  }

  async function runAudit() {
    setRunning(true);
    setMsg("جارٍ تشغيل التدقيق… قد يستغرق دقيقة، لا تُغلق الصفحة.");
    const res = await fetch("/api/audit/run", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
    const data = await res.json().catch(() => ({}));
    setRunning(false);
    if (!res.ok) { setMsg(data.error ?? "فشل التدقيق"); return; }
    setMsg("اكتمل التدقيق ✅"); router.refresh();
  }

  return (
    <div>
      <h2 className="admin-h2">الأسئلة المستهدفة ({prompts.length})</h2>
      <table className="admin-table">
        <tbody>
          {prompts.length === 0 && <tr><td>لا أسئلة بعد — أضف أسئلة يطرحها عملاؤك على الذكاء الاصطناعي.</td></tr>}
          {prompts.map((p) => <tr key={p.id}><td>{p.text}</td></tr>)}
        </tbody>
      </table>

      <div className="admin-form" style={{ maxWidth: 720 }}>
        <label>سؤال جديد
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="مثال: ما أفضل شركة تأمين سيارات في السعودية؟" />
        </label>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={addPrompt} disabled={adding || !text}>{adding ? "…" : "إضافة سؤال"}</button>
          <button className="btn btn-primary" onClick={runAudit} disabled={running || !hasPrompts} style={{ background: "#1a7a44" }}>
            {running ? "جارٍ التدقيق…" : "تشغيل التدقيق الآن"}
          </button>
        </div>
        {!hasPrompts && <p className="admin-note">أضف سؤالاً واحداً على الأقل قبل تشغيل التدقيق.</p>}
        {msg && <p className="admin-msg">{msg}</p>}
      </div>
    </div>
  );
}
