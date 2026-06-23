"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";

type T = { title: string; org: string; email: string; password: string; submit: string; busy: string; defaultOrg: string; orgErr: string; confirm: string; alt: string; altLink: string };

export default function SignupForm({ t }: { t: T }) {
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const supabase = supabaseBrowser();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { setBusy(false); setErr(error.message); return; }
    if (data.session) {
      const { error: orgErr } = await supabase.from("organizations").insert({ name: orgName || t.defaultOrg, owner_id: data.user!.id });
      setBusy(false);
      if (orgErr) { setErr(t.orgErr + orgErr.message); return; }
      router.push("/app"); router.refresh();
    } else {
      setBusy(false);
      setErr(t.confirm);
    }
  }

  return (
    <form className="auth-card" onSubmit={submit}>
      <h1 className="auth-title">{t.title}</h1>
      <label>{t.org}<input value={orgName} onChange={(e) => setOrgName(e.target.value)} required /></label>
      <label>{t.email}
        <input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      </label>
      <label>{t.password}
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" minLength={8} />
      </label>
      {err && <p className="auth-err">{err}</p>}
      <button className="btn btn-primary" disabled={busy}>{busy ? t.busy : t.submit}</button>
      <p className="auth-alt">{t.alt} <Link href="/login">{t.altLink}</Link></p>
    </form>
  );
}
