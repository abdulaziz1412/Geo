"use client";
// app/admin/plans/page.tsx — view + edit the plan catalogue (price/name/active).
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Plan = { code: string; name: string; price_cents: number; currency: string; is_active: boolean; tier: string; billing_interval: string };

export default function PlansAdmin() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    // Staff can read all plans (RLS: plans staff write / public read).
    const { data } = await supabaseBrowser().from("plans")
      .select("code, name, price_cents, currency, is_active, tier, billing_interval").order("sort_order");
    setPlans((data ?? []) as Plan[]);
  }
  useEffect(() => { load(); }, []);

  async function save(p: Plan) {
    setMsg(null);
    const res = await fetch("/api/admin/plans", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: p.code, tier: p.tier, name: p.name, price_cents: Number(p.price_cents),
        currency: p.currency, billing_interval: p.billing_interval, is_active: p.is_active,
      }),
    });
    setMsg(res.ok ? `تم حفظ باقة «${p.name}».` : "تعذّر الحفظ.");
    if (res.ok) load();
  }

  function update(i: number, patch: Partial<Plan>) {
    setPlans((cur) => cur.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }

  return (
    <section>
      <h1 className="admin-h1">الباقات</h1>
      <p className="admin-note">الأسعار بالهللات (٩٩٠٠ = ٩٩ ﷼). عدّل واضغط حفظ لكل باقة.</p>
      <table className="admin-table">
        <thead><tr><th>الرمز</th><th>الاسم</th><th>السعر (هللات)</th><th>نشطة</th><th></th></tr></thead>
        <tbody>
          {plans.map((p, i) => (
            <tr key={p.code}>
              <td dir="ltr">{p.code}</td>
              <td><input value={p.name} onChange={(e) => update(i, { name: e.target.value })} /></td>
              <td><input type="number" value={p.price_cents} onChange={(e) => update(i, { price_cents: Number(e.target.value) })} style={{ width: 110 }} /></td>
              <td><input type="checkbox" checked={p.is_active} onChange={(e) => update(i, { is_active: e.target.checked })} /></td>
              <td><button className="btn btn-primary" onClick={() => save(p)}>حفظ</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {msg && <p className="admin-msg">{msg}</p>}
    </section>
  );
}
