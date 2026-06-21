"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewProjectForm(
  { orgId, canCreate, maxProjects }: { orgId: string; canCreate: boolean; maxProjects: number },
) {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [domain, setDomain] = useState("");
  const [industry, setIndustry] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function create() {
    setBusy(true); setErr(null);
    const res = await fetch("/api/projects", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ org_id: orgId, business_name: businessName, domain: domain || null, industry: industry || null }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setErr(data.error ?? "تعذّر الإنشاء"); return; }
    router.push(`/app/projects/${data.id}`); router.refresh();
  }

  if (!canCreate) {
    return <p className="admin-note">بلغت حدّ باقتك ({maxProjects} مشروع). رقِّ باقتك لإنشاء المزيد.</p>;
  }
  return (
    <div className="admin-form">
      <label>اسم النشاط التجاري<input value={businessName} onChange={(e) => setBusinessName(e.target.value)} /></label>
      <label>النطاق (الموقع)<input dir="ltr" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com" /></label>
      <label>المجال<input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="تأمين، عقار، تجارة…" /></label>
      <button className="btn btn-primary" onClick={create} disabled={busy || !businessName}>{busy ? "جارٍ الإنشاء…" : "إنشاء المشروع"}</button>
      {err && <p className="auth-err">{err}</p>}
    </div>
  );
}
