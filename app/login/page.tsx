"use client";
// app/login/page.tsx — email/password sign-in. useSearchParams must live inside
// a Suspense boundary or the production build fails to prerender this route.
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { SiteHeader, SiteFooter } from "@/app/SiteChrome";

function safeNext(next: string | null): string {
  if (!next || next.startsWith("//") || !/^\/[A-Za-z0-9/_\-?=&.%]*$/.test(next)) return "/app";
  return next;
}

function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { setErr("بيانات الدخول غير صحيحة."); return; }
    router.push(next); router.refresh();
  }

  return (
    <form className="auth-card" onSubmit={submit}>
      <h1 className="auth-title">تسجيل الدخول</h1>
      <label>البريد الإلكتروني
        <input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      </label>
      <label>كلمة المرور
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
      </label>
      {err && <p className="auth-err">{err}</p>}
      <button className="btn btn-primary" disabled={busy}>{busy ? "جارٍ الدخول…" : "دخول"}</button>
      <p className="auth-alt">ليس لديك حساب؟ <Link href="/signup">إنشاء حساب</Link></p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="auth-page">
      <SiteHeader />
      <main className="auth-wrap">
      <Suspense fallback={<div className="auth-card"><h1 className="auth-title">تسجيل الدخول</h1></div>}>
        <LoginForm />
      </Suspense>
    </main>
      <SiteFooter />
    </div>
  );
}
