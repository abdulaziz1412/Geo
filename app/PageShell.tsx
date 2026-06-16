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
