// app/login/page.tsx — server shell: reads ?next= and the locale, renders the
// client form. Reading searchParams server-side removes the old useSearchParams
// + Suspense prerender workaround.
import { SiteHeader, SiteFooter } from "@/app/SiteChrome";
import { getLocale, getDict } from "@/lib/i18n";
import LoginForm from "./LoginForm";

export const metadata = { title: "تسجيل الدخول · ذِكر" };

function safeNext(next: string | null): string {
  if (!next || next.startsWith("//") || !/^\/[A-Za-z0-9/_\-?=&.%]*$/.test(next)) return "/app";
  return next;
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : null);
  const t = getDict(await getLocale());
  return (
    <div className="auth-page">
      <SiteHeader />
      <main className="auth-wrap">
        <LoginForm t={t.login} next={next} />
      </main>
      <SiteFooter />
    </div>
  );
}
