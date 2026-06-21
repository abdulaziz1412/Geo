// app/app/layout.tsx — auth gate + shell for the customer dashboard.
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/app", label: "نظرة عامة" },
  { href: "/app/billing", label: "الاشتراك والفواتير" },
  { href: "/app/support", label: "الدعم الفني" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireUser();
  } catch {
    redirect("/login?next=/app");
  }
  return (
    <div className="admin">
      <aside className="admin-side">
        <Link href="/app" className="admin-logo">ذِكر</Link>
        <nav className="admin-nav">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="admin-link">{n.label}</Link>
          ))}
        </nav>
        <Link href="/" className="admin-back">→ العودة للموقع</Link>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
