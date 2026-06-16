"use client";
// app/admin/settings/payments/page.tsx — enter provider keys here. Secrets are
// WRITE-ONLY from the browser: sent once over HTTPS, encrypted server-side,
// never returned. A blank secret field keeps the stored one.
import { useEffect, useState } from "react";

type Gateway = {
  provider: string; display_name: string; mode: "test" | "live";
  publishable_key: string | null; is_active: boolean;
  has_secret_key: boolean; has_webhook_secret: boolean;
};

const PROVIDERS = [
  { value: "moyasar", label: "Moyasar (السعودية)" },
  { value: "tap", label: "Tap (الخليج)" },
  { value: "stripe", label: "Stripe (عالمي)" },
  { value: "paytabs", label: "PayTabs" },
  { value: "hyperpay", label: "HyperPay" },
];

export default function PaymentSettingsPage() {
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [provider, setProvider] = useState("moyasar");
  const [displayName, setDisplayName] = useState("Moyasar");
  const [mode, setMode] = useState<"test" | "live">("test");
  const [publishableKey, setPublishableKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/payment-gateways");
    if (res.ok) setGateways((await res.json()).gateways ?? []);
  }
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const g = gateways.find((x) => x.provider === provider);
    if (g) { setDisplayName(g.display_name); setMode(g.mode); setPublishableKey(g.publishable_key ?? ""); setIsActive(g.is_active); }
    setSecretKey(""); setWebhookSecret("");
  }, [provider, gateways]);

  async function save() {
    setSaving(true); setMsg(null);
    const res = await fetch("/api/admin/payment-gateways", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider, display_name: displayName, mode,
        publishable_key: publishableKey || null,
        secret_key: secretKey || null, webhook_secret: webhookSecret || null,
        is_active: isActive,
      }),
    });
    setSaving(false);
    setMsg(res.ok ? "تم الحفظ بنجاح." : "تعذّر الحفظ — تأكّد من المدخلات.");
    if (res.ok) { setSecretKey(""); setWebhookSecret(""); load(); }
  }

  const current = gateways.find((x) => x.provider === provider);

  return (
    <section>
      <h1 className="admin-h1">بوابة الدفع</h1>
      <p className="admin-note">
        أدخل مفاتيح مزوّد الدفع. المفتاح السرّي يُحفظ مشفّراً ولا يظهر مجدداً؛ اترك الحقل فارغاً للإبقاء عليه.
      </p>
      <div className="admin-form">
        <label>المزوّد
          <select value={provider} onChange={(e) => setProvider(e.target.value)}>
            {PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </label>
        <label>الاسم الظاهر<input value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></label>
        <label>الوضع
          <select value={mode} onChange={(e) => setMode(e.target.value as "test" | "live")}>
            <option value="test">اختبار (test)</option>
            <option value="live">مباشر (live)</option>
          </select>
        </label>
        <label>المفتاح المنشور (Publishable)
          <input value={publishableKey} onChange={(e) => setPublishableKey(e.target.value)} placeholder="pk_…" autoComplete="off" />
        </label>
        <label>المفتاح السرّي (Secret) {current?.has_secret_key && <span className="admin-set">✓ محفوظ</span>}
          <input type="password" value={secretKey} onChange={(e) => setSecretKey(e.target.value)}
                 placeholder={current?.has_secret_key ? "•••• (محفوظ — اتركه للإبقاء)" : "sk_…"} autoComplete="new-password" />
        </label>
        <label>سرّ الويبهوك (Webhook secret) {current?.has_webhook_secret && <span className="admin-set">✓ محفوظ</span>}
          <input type="password" value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)}
                 placeholder={current?.has_webhook_secret ? "•••• (محفوظ)" : "whsec_…"} autoComplete="new-password" />
        </label>
        <label className="admin-check">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          تفعيل هذه البوابة (يُلغى تفعيل غيرها)
        </label>
        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "جارٍ الحفظ…" : "حفظ"}</button>
        {msg && <p className="admin-msg">{msg}</p>}
      </div>

      <h2 className="admin-h2">البوابات المهيّأة</h2>
      <table className="admin-table">
        <thead><tr><th>المزوّد</th><th>الوضع</th><th>سرّي</th><th>نشطة</th></tr></thead>
        <tbody>
          {gateways.length === 0 && <tr><td colSpan={4}>لا توجد بوابات بعد.</td></tr>}
          {gateways.map((g) => (
            <tr key={g.provider}>
              <td>{g.display_name}</td><td>{g.mode}</td>
              <td>{g.has_secret_key ? "✓" : "—"}</td><td>{g.is_active ? "نشطة" : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="admin-note">رابط الويبهوك لهذا المزوّد: <code>/api/payments/webhook/{provider}</code> — أضِفه في لوحة المزوّد.</p>
    </section>
  );
}
