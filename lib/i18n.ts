// lib/i18n.ts — minimal cookie-based bilingual layer (Arabic default + English).
import { cookies } from "next/headers";

export type Locale = "ar" | "en";
export const DEFAULT_LOCALE: Locale = "ar";
export const LOCALE_COOKIE = "locale";

export function dir(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return store.get(LOCALE_COOKIE)?.value === "en" ? "en" : "ar";
}

export type Dict = {
  brand: string;
  nav: { how: string; features: string; pricing: string; login: string; signup: string };
  hero: { eyebrow: string; titleA: string; titleMark: string; sub: string };
  answer: { head: string; q: string; bodyA: string; bodyMark: string; bodyB: string; cite: string };
  engines: { label: string; ar: string };
  how: { kicker: string; title: string; n1: string; n2: string; n3: string; s1h: string; s1p: string; s2h: string; s2p: string; s3h: string; s3p: string };
  features: { kicker: string; title: string; f1h: string; f1p: string; f2h: string; f2p: string; f3h: string; f3p: string; f4h: string; f4p: string };
  closing: { title: string; sub: string; cta: string };
  foot: { privacy: string; terms: string; refund: string; contact: string; note: string };
  waitlist: { emailPh: string; sitePh: string; emailAria: string; siteAria: string; submit: string; sending: string; doneTitle: string; doneSub: string; errEmail: string; errSend: string; note: string };
  langLabel: string;
};

const ar: Dict = {
  brand: "ذِكر",
  nav: { how: "كيف يعمل", features: "المزايا", pricing: "الأسعار", login: "تسجيل الدخول", signup: "إنشاء حساب" },
  hero: {
    eyebrow: "تحسين الظهور في محرّكات الذكاء الاصطناعي",
    titleA: "اجعل علامتك التجارية هي",
    titleMark: "الإجابة",
    sub: "عملاؤك صاروا يسألون ChatGPT وPerplexity وGemini بدل البحث في جوجل. ذِكر يقيس ظهور علامتك داخل إجاباتها، ويُريك بالضبط كيف تصبح الاسم الذي تُوصي به.",
  },
  answer: {
    head: "إجابة الذكاء الاصطناعي",
    q: "«ما أفضل شركة تأمين سيارات في السعودية؟»",
    bodyA: "من بين الخيارات الموثوقة، تبرز",
    bodyMark: "شركتك",
    bodyB: "بتقييمات مرتفعة وتغطية مرنة وأسعار تنافسية، إضافةً إلى…",
    cite: "١ مصدر: yourbrand.com",
  },
  engines: { label: "نراقب ظهورك في:", ar: "Jais · النماذج العربية" },
  how: {
    kicker: "كيف يعمل",
    title: "من «غير ظاهر» إلى «الإجابة المُوصى بها»",
    n1: "١", n2: "٢", n3: "٣",
    s1h: "نقيس ظهورك", s1p: "نسأل المحرّكات أسئلة عملائك الحقيقية، ونرصد متى تُذكر علامتك ومتى تُذكر المنافسة.",
    s2h: "نشخّص الفجوة", s2p: "نُظهر حصّتك من الإجابات مقابل المنافسين، والمصادر التي تستشهد بها المحرّكات.",
    s3h: "نرفع حضورك", s3p: "نقترح ونصيغ المحتوى الذي يجعل المحرّكات تذكرك وتستشهد بموقعك.",
  },
  features: {
    kicker: "المزايا",
    title: "مبنيٌّ للسوق، لا مترجَمٌ إليه",
    f1h: "عربيٌّ أولاً", f1p: "نفهم اللهجات وصياغة الأسئلة كما يكتبها عملاؤك فعلاً، لا ترجمة حرفية.",
    f2h: "كل المحرّكات في مكانٍ واحد", f2p: "تتبّعٌ موحّد عبر ChatGPT وPerplexity وGemini ونتائج جوجل التوليدية.",
    f3h: "حصّتك من الصوت", f3p: "اعرف نسبة ظهورك مقابل كل منافس، وتابع تغيّرها أسبوعاً بأسبوع.",
    f4h: "النماذج الإقليمية", f4p: "نراقب نماذج عربية مثل Jais وFalcon التي تتجاهلها الأدوات العالمية.",
  },
  closing: { title: "اعرف ظهورك اليوم — مجاناً", sub: "سنحلّل علامتك عبر المحرّكات ونرسل لك تقريراً واضحاً بأول الخطوات.", cta: "احصل على تقريري المجاني" },
  foot: { privacy: "سياسة الخصوصية", terms: "الشروط والأحكام", refund: "الاسترجاع والاستبدال", contact: "اتصل بنا", note: "© ٢٠٢٦ ذِكر — تحسين الظهور في محرّكات الذكاء الاصطناعي" },
  waitlist: {
    emailPh: "your@email.com", sitePh: "yourbrand.com",
    emailAria: "البريد الإلكتروني", siteAria: "رابط الموقع",
    submit: "أرسِل لي التقرير المجاني", sending: "جارٍ الإرسال…",
    doneTitle: "وصلنا طلبك.", doneSub: "سنحلّل ظهور موقعك في إجابات الذكاء الاصطناعي ونرسل لك التقرير على بريدك.",
    errEmail: "اكتب بريدك الإلكتروني لنرسل لك التقرير.", errSend: "تعذّر الإرسال الآن. حاول مرة أخرى بعد قليل.",
    note: "مجاني تماماً. بريدك لن يُشارك مع أحد.",
  },
  langLabel: "EN",
};

const en: Dict = {
  brand: "ذِكر",
  nav: { how: "How it works", features: "Features", pricing: "Pricing", login: "Log in", signup: "Sign up" },
  hero: {
    eyebrow: "Generative Engine Optimization",
    titleA: "Make your brand the",
    titleMark: "answer",
    sub: "Your customers now ask ChatGPT, Perplexity, and Gemini instead of searching Google. Thikr measures how your brand shows up in their answers and shows you exactly how to become the name they recommend.",
  },
  answer: {
    head: "AI answer",
    q: "\u201CWhat\u2019s the best car insurance company in Saudi Arabia?\u201D",
    bodyA: "Among the trusted options,",
    bodyMark: "your company",
    bodyB: "stands out with strong ratings, flexible coverage, and competitive prices, plus\u2026",
    cite: "1 source: yourbrand.com",
  },
  engines: { label: "We track you across:", ar: "Jais \u00B7 Arabic models" },
  how: {
    kicker: "How it works",
    title: "From \u201Cinvisible\u201D to \u201Cthe recommended answer\u201D",
    n1: "1", n2: "2", n3: "3",
    s1h: "We measure visibility", s1p: "We ask the engines your customers\u2019 real questions and track when your brand is mentioned versus competitors.",
    s2h: "We diagnose the gap", s2p: "We show your share of answers against competitors, and the sources the engines cite.",
    s3h: "We grow your presence", s3p: "We suggest and write the content that makes the engines mention you and cite your site.",
  },
  features: {
    kicker: "Features",
    title: "Built for its market, not translated into it",
    f1h: "Bilingual by design", f1p: "We understand how customers actually phrase questions \u2014 in Arabic and English \u2014 not literal translation.",
    f2h: "Every engine in one place", f2p: "Unified tracking across ChatGPT, Perplexity, Gemini, and Google\u2019s generative results.",
    f3h: "Your share of voice", f3p: "See your visibility against each competitor, and track how it shifts week over week.",
    f4h: "Regional models", f4p: "We monitor Arabic models like Jais and Falcon that global tools ignore.",
  },
  closing: { title: "See your visibility today \u2014 free", sub: "We\u2019ll analyze your brand across the engines and send you a clear report with your first steps.", cta: "Get my free report" },
  foot: { privacy: "Privacy", terms: "Terms", refund: "Refunds & Returns", contact: "Contact", note: "\u00A9 2026 \u0630\u0650\u0643\u0631 \u2014 Generative Engine Optimization" },
  waitlist: {
    emailPh: "your@email.com", sitePh: "yourbrand.com",
    emailAria: "Email", siteAria: "Website",
    submit: "Send me the free report", sending: "Sending\u2026",
    doneTitle: "Got your request.", doneSub: "We\u2019ll analyze how your site shows up in AI answers and send the report to your email.",
    errEmail: "Enter your email so we can send you the report.", errSend: "Couldn\u2019t send right now. Please try again shortly.",
    note: "Completely free. Your email won\u2019t be shared.",
  },
  langLabel: "ع",
};

export const dictionaries: Record<Locale, Dict> = { ar, en };

export function getDict(locale: Locale): Dict {
  return dictionaries[locale];
}
