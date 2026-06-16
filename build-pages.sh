#!/usr/bin/env bash
# Creates the policy/legal + contact pages for the GEO site. No external keys needed.
# Run from the project root:  bash build-pages.sh
set -e
echo "==> Creating page folders…"
mkdir -p app/privacy app/terms app/refund app/contact app/api/contact

cat > app/PageShell.tsx << 'SHELL_EOF'
import Link from "next/link";

export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="page">
      <header className="nav">
        <div className="wrap nav-in">
          <Link href="/" className="brand font-display">ذِكر</Link>
          <Link href="/" className="btn btn-ghost btn-sm">العودة للرئيسية</Link>
        </div>
      </header>
      <main className="wrap">{children}</main>
      <footer className="foot">
        <div className="wrap foot-in">
          <nav className="foot-links">
            <Link href="/privacy">سياسة الخصوصية</Link>
            <Link href="/terms">الشروط والأحكام</Link>
            <Link href="/refund">الاسترجاع والاستبدال</Link>
            <Link href="/contact">اتصل بنا</Link>
          </nav>
          <span className="foot-note">© ٢٠٢٦ ذِكر</span>
        </div>
      </footer>
    </div>
  );
}
SHELL_EOF

cat > app/privacy/page.tsx << 'PRIVACY_EOF'
import type { Metadata } from "next";
import PageShell from "../PageShell";

export const metadata: Metadata = { title: "سياسة الخصوصية — ذِكر" };

export default function PrivacyPage() {
  return (
    <PageShell>
      <article className="legal">
        <h1 className="font-display">سياسة الخصوصية</h1>
        <p className="legal-updated">آخر تحديث: يونيو ٢٠٢٦</p>

        <p>تشرح هذه السياسة كيف نجمع بياناتك ونستخدمها ونحميها عند استخدامك منصة «ذِكر». باستخدامك المنصة فإنك توافق على ما ورد فيها.</p>

        <h2>البيانات التي نجمعها</h2>
        <ul>
          <li>بيانات تُقدّمها بنفسك: بريدك الإلكتروني، واسم نشاطك، ورابط موقعك عند التسجيل أو طلب تقرير.</li>
          <li>بيانات الاستخدام: الصفحات التي تزورها وتفاعلك مع المنصة، لتحسين الخدمة.</li>
          <li>ملفات تعريف الارتباط (Cookies) لحفظ تفضيلاتك وقياس الأداء.</li>
        </ul>

        <h2>كيف نستخدم بياناتك</h2>
        <ul>
          <li>تشغيل الخدمة وإرسال تقارير ظهور علامتك في محرّكات الذكاء الاصطناعي.</li>
          <li>التواصل معك بشأن حسابك أو تحديثات الخدمة.</li>
          <li>تحسين المنصة وتطوير ميزات جديدة.</li>
        </ul>

        <h2>مشاركة البيانات</h2>
        <p>لا نبيع بياناتك. وقد نشاركها مع مزوّدي خدمات موثوقين (مثل الاستضافة وتحليلات الأداء) بالقدر اللازم لتشغيل الخدمة فقط، وبموجب التزامات سرّية.</p>

        <h2>حقوقك</h2>
        <p>يحقّ لك الوصول إلى بياناتك أو تصحيحها أو طلب حذفها. للتواصل بخصوص بياناتك راسلنا عبر صفحة «اتصل بنا».</p>

        <h2>التغييرات على السياسة</h2>
        <p>قد نُحدّث هذه السياسة من وقت لآخر، وسننشر أي تغييرات على هذه الصفحة مع تحديث تاريخ آخر مراجعة.</p>
      </article>
    </PageShell>
  );
}
PRIVACY_EOF

cat > app/terms/page.tsx << 'TERMS_EOF'
import type { Metadata } from "next";
import PageShell from "../PageShell";

export const metadata: Metadata = { title: "الشروط والأحكام — ذِكر" };

export default function TermsPage() {
  return (
    <PageShell>
      <article className="legal">
        <h1 className="font-display">الشروط والأحكام</h1>
        <p className="legal-updated">آخر تحديث: يونيو ٢٠٢٦</p>

        <p>باستخدامك منصة «ذِكر» فإنك توافق على هذه الشروط. يُرجى قراءتها بعناية قبل استخدام الخدمة.</p>

        <h2>وصف الخدمة</h2>
        <p>«ذِكر» منصة تقيس ظهور علامتك التجارية داخل إجابات محرّكات الذكاء الاصطناعي، وتقدّم توصيات لتحسين هذا الظهور. وقد تتغيّر الميزات أو يتوقّف بعضها مع تطوّر المنصة.</p>

        <h2>الحساب والاستخدام المقبول</h2>
        <ul>
          <li>أنت مسؤول عن صحّة البيانات التي تقدّمها وعن سرّية حسابك.</li>
          <li>يُمنع استخدام المنصة لأي غرض غير مشروع أو بما يضرّ بالخدمة أو بالمستخدمين الآخرين.</li>
        </ul>

        <h2>الاشتراكات والدفع</h2>
        <p>قد تتطلّب بعض الميزات اشتراكاً مدفوعاً. تُعرض الأسعار ودورة الفوترة قبل الاشتراك، وتُجدَّد الاشتراكات تلقائياً ما لم تُلغِها قبل تاريخ التجديد.</p>

        <h2>الملكية الفكرية</h2>
        <p>جميع حقوق المنصة ومحتواها مملوكة لنا، ولا يجوز نسخها أو إعادة استخدامها دون إذن.</p>

        <h2>حدود المسؤولية</h2>
        <p>تُقدَّم الخدمة «كما هي». ولا نضمن نتائج محدّدة في ترتيب ظهورك لدى محرّكات الذكاء الاصطناعي، فهي خاضعة لأنظمة خارجية لا نتحكّم بها.</p>

        <h2>القانون المُطبَّق</h2>
        <p>تخضع هذه الشروط لأنظمة المملكة العربية السعودية، وتختصّ جهاتها القضائية بأي نزاع ينشأ عنها.</p>
      </article>
    </PageShell>
  );
}
TERMS_EOF

cat > app/refund/page.tsx << 'REFUND_EOF'
import type { Metadata } from "next";
import PageShell from "../PageShell";

export const metadata: Metadata = { title: "سياسة الاسترجاع والاستبدال — ذِكر" };

export default function RefundPage() {
  return (
    <PageShell>
      <article className="legal">
        <h1 className="font-display">سياسة الاسترجاع والاستبدال</h1>
        <p className="legal-updated">آخر تحديث: يونيو ٢٠٢٦</p>

        <p>نحرص على رضاك عن خدمة «ذِكر». توضّح هذه السياسة شروط استرجاع المبالغ وتغيير الاشتراكات لخدمة رقمية تُقدَّم باشتراك.</p>

        <h2>طلب الاسترجاع</h2>
        <ul>
          <li>يمكنك طلب استرجاع كامل خلال ١٤ يوماً من بدء أول اشتراك مدفوع إذا لم تكن الخدمة مناسبة لك.</li>
          <li>بعد هذه المدة، تُحتسب الاشتراكات المدفوعة عن فترةٍ استُخدمت فيها الخدمة، وتكون غير قابلة للاسترجاع.</li>
        </ul>

        <h2>تغيير الباقة (الاستبدال)</h2>
        <p>يمكنك الترقية أو التخفيض بين الباقات في أي وقت، ويُحتسب الفرق بشكل تناسبي على دورة الفوترة التالية.</p>

        <h2>إلغاء الاشتراك</h2>
        <p>يمكنك إلغاء التجديد التلقائي في أي وقت من إعدادات حسابك، وتبقى الخدمة فعّالة حتى نهاية الفترة المدفوعة.</p>

        <h2>كيفية تقديم الطلب</h2>
        <p>لطلب استرجاع أو تغيير باقة، تواصل معنا عبر صفحة «اتصل بنا» مع ذكر بريد حسابك، وسنردّ خلال ٣ أيام عمل.</p>
      </article>
    </PageShell>
  );
}
REFUND_EOF

cat > app/contact/ContactForm.tsx << 'CONTACTFORM_EOF'
"use client";

import { useState } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("يرجى تعبئة الاسم والبريد والرسالة.");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("done");
    } catch {
      setStatus("error");
      setError("تعذّر الإرسال الآن. حاول مرة أخرى بعد قليل.");
    }
  }

  if (status === "done") {
    return (
      <div className="form-done">
        <strong>وصلتنا رسالتك.</strong>
        <span>شكراً لتواصلك معنا، سنردّ على بريدك في أقرب وقت.</span>
      </div>
    );
  }

  return (
    <form className="signup" onSubmit={submit} noValidate>
      <input className="field" type="text" placeholder="الاسم" value={name} onChange={(e) => setName(e.target.value)} aria-label="الاسم" />
      <input className="field" type="email" dir="ltr" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="البريد الإلكتروني" />
      <textarea className="field" rows={5} placeholder="رسالتك" value={message} onChange={(e) => setMessage(e.target.value)} aria-label="الرسالة" />
      <button className="btn btn-primary" type="submit" disabled={status === "loading"}>
        {status === "loading" ? "جارٍ الإرسال…" : "إرسال الرسالة"}
      </button>
      {error && <p className="form-error">{error}</p>}
    </form>
  );
}
CONTACTFORM_EOF

cat > app/contact/page.tsx << 'CONTACT_EOF'
import type { Metadata } from "next";
import PageShell from "../PageShell";
import ContactForm from "./ContactForm";

export const metadata: Metadata = { title: "اتصل بنا — ذِكر" };

export default function ContactPage() {
  return (
    <PageShell>
      <article className="legal">
        <h1 className="font-display">اتصل بنا</h1>
        <p>عندك سؤال أو تحتاج مساعدة؟ اكتب لنا وسنردّ في أقرب وقت، أو راسلنا مباشرةً على <a href="mailto:hello@thkr.app">hello@thkr.app</a>.</p>
        <div className="contact-grid">
          <ContactForm />
        </div>
      </article>
    </PageShell>
  );
}
CONTACT_EOF

cat > app/api/contact/route.ts << 'CONTACTAPI_EOF'
import { NextRequest, NextResponse } from "next/server";

// Receives a contact-form message. No external keys needed yet.
// TODO (final step): forward to email and/or store in the database.
export async function POST(req: NextRequest) {
  let body: { name?: string; email?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim();
  const message = (body.message ?? "").trim();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!name || !valid || !message) {
    return NextResponse.json({ error: "invalid input" }, { status: 422 });
  }

  console.log("[contact] new message:", { name, email, message, at: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}
CONTACTAPI_EOF

echo "==> Appending styles for sub-pages to globals.css…"
cat >> app/globals.css << 'CSS_EOF'

/* sub-pages: legal + contact */
.page { display: flex; flex-direction: column; min-height: 100vh; }
.page > main { flex: 1; }
.legal { max-width: 760px; margin: 0 auto; padding: 56px 0 72px; }
.legal h1 { font-size: clamp(30px, 4.4vw, 44px); margin: 0 0 6px; }
.legal-updated { color: var(--muted); font-size: 14px; margin: 0 0 28px; }
.legal h2 { font-size: 21px; margin: 34px 0 10px; }
.legal p { margin: 0 0 14px; }
.legal ul { margin: 0 0 14px; padding-inline-start: 22px; display: grid; gap: 8px; }
.legal a { color: var(--accent); text-decoration: underline; }
.legal textarea.field { resize: vertical; line-height: 1.7; }
.contact-grid { max-width: 480px; margin-top: 8px; }
.foot-links { display: flex; flex-wrap: wrap; gap: 8px 20px; font-size: 14px; color: var(--muted); }
.foot-links a:hover { color: var(--ink); }
CSS_EOF

echo "==> Adding footer links to the home page…"
sed -i 's#<span className="foot-note">#<nav className="foot-links"><a href="/privacy">سياسة الخصوصية</a> <a href="/terms">الشروط والأحكام</a> <a href="/refund">الاسترجاع والاستبدال</a> <a href="/contact">اتصل بنا</a></nav>\n          <span className="foot-note">#' app/page.tsx

echo "==> Done. New pages: /privacy /terms /refund /contact"
