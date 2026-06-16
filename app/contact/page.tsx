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
