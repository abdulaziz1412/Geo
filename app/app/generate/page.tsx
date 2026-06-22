"use client";
// app/app/generate/page.tsx — generate citation-ready GEO content for a project.
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

const TYPES = [
  { value: "faq", label: "أسئلة شائعة (FAQ)" },
  { value: "comparison", label: "مقارنة" },
  { value: "entity_rich", label: "محتوى غنيّ بالكيانات" },
  { value: "landing", label: "صفحة خدمة" },
];

interface Project { id: string; business_name: string; }
interface Result { id: string; title: string; bodyMd: string; schemaJsonld: unknown; }

export default function GeneratePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [type, setType] = useState("faq");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    supabaseBrowser()
      .from("projects")
      .select("id, business_name")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const list = (data ?? []) as Project[];
        setProjects(list);
        if (list[0]) setProjectId(list[0].id);
      });
  }, []);

  async function generate() {
    if (!projectId || !query.trim()) {
      setErr("اختر مشروعاً واكتب السؤال أو الموضوع المستهدف.");
      return;
    }
    setBusy(true); setErr(null); setResult(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, type, targetQuery: query }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error ?? "تعذّر التوليد. تأكّد من إضافة مفتاح الذكاء الاصطناعي في الإعدادات.");
        return;
      }
      setResult({ id: data.id, title: data.title, bodyMd: data.bodyMd, schemaJsonld: data.schemaJsonld });
    } catch {
      setErr("حدث خطأ غير متوقع. حاول مجدداً.");
    } finally {
      setBusy(false);
    }
  }

  function copy(text: string, which: string) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(which);
      setTimeout(() => setCopied(""), 1500);
    });
  }

  return (
    <section>
      <h1 className="admin-h1">توليد المحتوى</h1>
      <p className="admin-note">
        ولّد محتوى مُحسّناً ليُستشهَد به في إجابات الذكاء الاصطناعي — صفحات أسئلة ومقارنات ومحتوى غنيّ
        بالكيانات — مع بيانات Schema منظَّمة جاهزة للنشر على موقعك.
      </p>

      <div className="admin-form" style={{ maxWidth: 640 }}>
        <label>
          المشروع
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            {projects.length === 0 && <option value="">لا توجد مشاريع — أنشئ مشروعاً أولاً</option>}
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.business_name}</option>
            ))}
          </select>
        </label>
        <label>
          نوع المحتوى
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </label>
        <label>
          السؤال أو الموضوع المستهدف
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="مثال: ما أفضل شركة شحن للمتاجر في الرياض؟"
          />
        </label>
        <button className="btn btn-primary" onClick={generate} disabled={busy}>
          {busy ? "جارٍ التوليد…" : "توليد"}
        </button>
        {err && <p className="auth-err">{err}</p>}
      </div>

      {result && (
        <div style={{ marginTop: 28 }}>
          <h2 className="admin-h2">{result.title}</h2>
          <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            <button className="btn btn-ghost btn-sm" onClick={() => copy(result.bodyMd, "md")}>
              {copied === "md" ? "نُسخ ✓" : "نسخ المحتوى (Markdown)"}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => copy(JSON.stringify(result.schemaJsonld, null, 2), "schema")}
            >
              {copied === "schema" ? "نُسخ ✓" : "نسخ Schema (JSON-LD)"}
            </button>
          </div>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              background: "#fff",
              border: "1px solid var(--geo-line)",
              borderRadius: 14,
              padding: 20,
              lineHeight: 1.9,
              fontFamily: "inherit",
            }}
          >
            {result.bodyMd}
          </pre>
          <h3 className="admin-h2" style={{ fontSize: "1rem" }}>Schema (JSON-LD)</h3>
          <pre
            dir="ltr"
            style={{
              whiteSpace: "pre-wrap",
              background: "#1c1b2e",
              color: "#e6e5f5",
              borderRadius: 14,
              padding: 20,
              fontSize: ".82rem",
              overflowX: "auto",
            }}
          >
            {JSON.stringify(result.schemaJsonld, null, 2)}
          </pre>
        </div>
      )}
    </section>
  );
}
