// app/signup/page.tsx — server shell: reads the locale, renders the client form.
import { SiteHeader, SiteFooter } from "@/app/SiteChrome";
import { getLocale, getDict } from "@/lib/i18n";
import SignupForm from "./SignupForm";

export const metadata = { title: "إنشاء حساب · ذِكر" };

export default async function SignupPage() {
  const t = getDict(await getLocale());
  return (
    <div className="auth-page">
      <SiteHeader />
      <main className="auth-wrap">
        <SignupForm t={t.signup} />
      </main>
      <SiteFooter />
    </div>
  );
}
