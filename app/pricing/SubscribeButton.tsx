"use client";
// app/pricing/SubscribeButton.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function SubscribeButton({ planCode, isFree }: { planCode: string; isFree: boolean }) {
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
    if (!orgId) { setErr("أنشئ مؤسسة أولاً."); setBusy(false); return; }

    const res = await fetch("/api/payments/checkout", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ org_id: orgId, plan_code: planCode }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok || !data.redirectUrl) { setErr(data.error ?? "تعذّر بدء الدفع."); return; }
    window.location.href = data.redirectUrl;
  }

  return (
    <>
      <button className="btn btn-primary" onClick={subscribe} disabled={busy}>
        {busy ? "…" : isFree ? "ابدأ مجاناً" : "اشترك"}
      </button>
      {err && <p className="auth-err">{err}</p>}
    </>
  );
}
