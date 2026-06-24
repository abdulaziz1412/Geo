"use client";
// app/pricing/SubscribeButton.tsx — bilingual labels/errors via the `t` prop.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

type T = { ctaFree: string; ctaPaid: string; busy: string; errOrg: string; errPay: string };

export default function SubscribeButton({ planCode, isFree, t }: { planCode: string; isFree: boolean; t: T }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function subscribe() {
    setBusy(true); setErr(null);
    const supabase = supabaseBrowser();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login?next=/pricing"); return; }
    if (isFree) { router.push("/app"); return; }

    const { data: orgs } = await supabase.from("organizations").select("id").limit(1);
    const orgId = orgs?.[0]?.id;
    if (!orgId) { setErr(t.errOrg); setBusy(false); return; }

    const res = await fetch("/api/payments/checkout", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ org_id: orgId, plan_code: planCode }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok || !data.redirectUrl) { setErr(data.error ?? t.errPay); return; }
    window.location.href = data.redirectUrl;
  }

  return (
    <>
      <button className="btn btn-primary" onClick={subscribe} disabled={busy}>
        {busy ? t.busy : isFree ? t.ctaFree : t.ctaPaid}
      </button>
      {err && <p className="auth-err">{err}</p>}
    </>
  );
}
