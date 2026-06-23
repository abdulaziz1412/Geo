// app/SiteChrome.tsx — shared site header/footer (bilingual + language switch).
import Link from "next/link";
import { getLocale, getDict } from "@/lib/i18n";
import LangSwitcher from "./LangSwitcher";

export async function SiteHeader() {
  const t = getDict(await getLocale());
  return (
    <header className="site-header">
      <div className="wrap site-header-in">
        <Link href="/" className="brand font-display">{t.brand}</Link>
        <nav className="site-nav">
          <Link href="/pricing">{t.chrome.pricing}</Link>
          <Link href="/login">{t.chrome.login}</Link>
          <Link href="/signup" className="btn btn-primary btn-sm">{t.chrome.signup}</Link>
          <LangSwitcher label={t.langLabel} />
        </nav>
      </div>
    </header>
  );
}

export async function SiteFooter() {
  const t = getDict(await getLocale());
  return (
    <footer className="foot">
      <div className="wrap foot-in">
        <span className="brand font-display">{t.brand}</span>
        <nav className="foot-links">
          <Link href="/pricing">{t.chrome.fPricing}</Link>
          <Link href="/privacy">{t.chrome.fPrivacy}</Link>
          <Link href="/terms">{t.chrome.fTerms}</Link>
          <Link href="/contact">{t.chrome.fContact}</Link>
        </nav>
        <span className="foot-note">{t.chrome.note}</span>
      </div>
    </footer>
  );
}
