// app/pricing/page.tsx — public pricing (bilingual). Plan name/description/
// features come from the dictionary by plan code (English in en, Arabic in ar,
// DB as fallback). Price shows in SAR (ar) or the matching USD (en, via peg).
import { supabaseAdmin } from "@/lib/supabase/admin";
import SubscribeButton from "./SubscribeButton";
import { SiteHeader, SiteFooter } from "@/app/SiteChrome";
import { getLocale, getDict, SAR_PER_USD } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "الباقات والأسعار · ذِكر" };

export default async function PricingPage() {
  const locale = await getLocale();
  const t = getDict(locale);
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
          {plans.map((p) => {
            const c = t.plans[p.code];
            const name = c?.name ?? p.name;
            const desc = c?.desc ?? p.description;
            const features = c?.features ?? (Array.isArray(p.features) ? p.features : []);
            const sar = p.price_cents / 100;
            const priceLabel = locale === "en"
              ? "$" + Math.round(sar / SAR_PER_USD).toLocaleString("en-US")
              : sar.toLocaleString("ar-SA");
            return (
              <div key={p.code} className="pricing-card">
                <h2 className="pricing-name">{name}</h2>
                <p className="pricing-desc">{desc}</p>
                <div className="pricing-price">
                  {p.price_cents === 0 ? t.pricing.free : <>{priceLabel} <span>{t.pricing.priceSuffix}</span></>}
                </div>
                <ul className="pricing-feats">
                  {features.map((f: string, i: number) => <li key={i}>{f}</li>)}
                </ul>
                <SubscribeButton planCode={p.code} isFree={p.price_cents === 0} t={t.subscribe} />
              </div>
            );
          })}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
