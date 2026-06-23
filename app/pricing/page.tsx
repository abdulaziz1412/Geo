// app/pricing/page.tsx — public pricing from the plans catalogue (bilingual chrome).
import { supabaseAdmin } from "@/lib/supabase/admin";
import SubscribeButton from "./SubscribeButton";
import { SiteHeader, SiteFooter } from "@/app/SiteChrome";
import { getLocale, getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "الباقات والأسعار · ذِكر" };

export default async function PricingPage() {
  const locale = await getLocale();
  const t = getDict(locale);
  const nf = locale === "ar" ? "ar-SA" : "en-US";
  const { data } = await supabaseAdmin().from("plans")
    .select("code, name, description, price_cents, currency, billing_interval, features, is_active")
    .eq("is_active", true).order("sort_order");
  const plans = (data ?? []) as any[];

  return (
    <div className="auth-page">
      <SiteHeader />
      <main className="pricing-wrap">
        <h1 className="pricing-title">{t.pricing.title}</h1>
        <p className="pricing-sub">{t.pricing.sub}</p>
        <div className="pricing-grid">
          {plans.map((p) => (
            <div key={p.code} className="pricing-card">
              <h2 className="pricing-name">{p.name}</h2>
              <p className="pricing-desc">{p.description}</p>
              <div className="pricing-price">
                {p.price_cents === 0 ? t.pricing.free : <>{(p.price_cents / 100).toLocaleString(nf)} <span>{t.pricing.per}</span></>}
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
