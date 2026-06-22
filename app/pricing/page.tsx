// app/pricing/page.tsx — public pricing from the plans catalogue.
import { supabaseAdmin } from "@/lib/supabase/admin";
import SubscribeButton from "./SubscribeButton";
import { SiteHeader, SiteFooter } from "@/app/SiteChrome";

export const dynamic = "force-dynamic";
export const metadata = { title: "الباقات والأسعار · ذِكر" };

export default async function PricingPage() {
  const { data } = await supabaseAdmin().from("plans")
    .select("code, name, description, price_cents, currency, billing_interval, features, is_active")
    .eq("is_active", true).order("sort_order");
  const plans = (data ?? []) as any[];

  return (
    <div className="auth-page">
      <SiteHeader />
      <main className="pricing-wrap">
      <h1 className="pricing-title">الباقات والأسعار</h1>
      <p className="pricing-sub">اختر ما يناسب نشاطك. يمكنك الترقية في أي وقت.</p>
      <div className="pricing-grid">
        {plans.map((p) => (
          <div key={p.code} className="pricing-card">
            <h2 className="pricing-name">{p.name}</h2>
            <p className="pricing-desc">{p.description}</p>
            <div className="pricing-price">
              {p.price_cents === 0 ? "مجاناً" : <>{(p.price_cents / 100).toLocaleString("ar-SA")} <span>﷼ / شهرياً</span></>}
            </div>
            <ul className="pricing-feats">
              {(Array.isArray(p.features) ? p.features : []).map((f: string, i: number) => <li key={i}>{f}</li>)}
            </ul>
            <SubscribeButton planCode={p.code} isFree={p.price_cents === 0} />
          </div>
        ))}
      </div>
    </main>
      <SiteFooter />
    </div>
  );
}
