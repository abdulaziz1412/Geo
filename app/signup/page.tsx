"use client";
// app/signup/page.tsx — create an account, then the first organization. RLS
// requires owner_id = auth.uid(); a DB trigger adds the owner as first member.
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function SignupPage() {
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
      const { error: orgErr } = await supabase.from("organizations").insert({ name: orgName || "مؤسستي", owner_id: data.user!.id });
      setBusy(false);
      if (orgErr) { setErr("أُنشئ الحساب، لكن تعذّر إنشاء المؤسسة: " + orgErr.message); return; }
      router.push("/app"); router.refresh();
    } else {
      setBusy(false);
      setErr("تحقّق من بريدك لتأكيد الحساب ثم سجّل الدخول.");
    }
  }

  return (
    <main className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <h1 className="auth-title">إنشاء حساب</h1>
        <label>اسم المؤسسة<input value={orgName} onChange={(e) => setOrgName(e.target.value)} required /></label>
        <label>البريد الإلكتروني
          <input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label>كلمة المرور
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" minLength={8} />
        </label>
        {err && <p className="auth-err">{err}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? "جارٍ الإنشاء…" : "إنشاء الحساب"}</button>
        <p className="auth-alt">لديك حساب؟ <Link href="/login">تسجيل الدخول</Link></p>
      </form>
    </main>
  );
}
