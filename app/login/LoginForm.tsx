"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";

type T = { title: string; email: string; password: string; submit: string; busy: string; bad: string; alt: string; altLink: string };

export default function LoginForm({ t, next }: { t: T; next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { setErr(t.bad); return; }
    router.push(next); router.refresh();
  }

  return (
    <form className="auth-card" onSubmit={submit}>
      <h1 className="auth-title">{t.title}</h1>
      <label>{t.email}
        <input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      </label>
      <label>{t.password}
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
      </label>
      {err && <p className="auth-err">{err}</p>}
      <button className="btn btn-primary" disabled={busy}>{busy ? t.busy : t.submit}</button>
      <p className="auth-alt">{t.alt} <Link href="/signup">{t.altLink}</Link></p>
    </form>
  );
}
