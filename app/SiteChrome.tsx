// app/SiteChrome.tsx — shared site header/footer for marketing & auth pages.
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="wrap site-header-in">
        <Link href="/" className="brand font-display">ذِكر</Link>
        <nav className="site-nav">
          <Link href="/pricing">الأسعار</Link>
          <Link href="/login">تسجيل الدخول</Link>
          <Link href="/signup" className="btn btn-primary btn-sm">إنشاء حساب</Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="foot">
      <div className="wrap foot-in">
        <span className="brand font-display">ذِكر</span>
        <nav className="foot-links">
          <Link href="/pricing">الأسعار</Link>
          <Link href="/privacy">سياسة الخصوصية</Link>
          <Link href="/terms">الشروط والأحكام</Link>
          <Link href="/contact">اتصل بنا</Link>
        </nav>
        <span className="foot-note">© ٢٠٢٦ ذِكر</span>
      </div>
    </footer>
  );
}
