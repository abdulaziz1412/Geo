// app/admin/layout.tsx — server-side gate for the entire /admin area.
import { redirect } from "next/navigation";
import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "نظرة عامة" },
  { href: "/admin/subscriptions", label: "الاشتراكات" },
  { href: "/admin/payments", label: "المدفوعات" },
  { href: "/admin/tickets", label: "تذاكر الدعم" },
  { href: "/admin/messages", label: "الرسائل" },
  { href: "/admin/plans", label: "الباقات" },
  { href: "/admin/settings/payments", label: "بوابة الدفع" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requirePlatformAdmin();
  } catch {
    redirect("/login?next=/admin");
  }
  return (
    <div className="admin">
      <aside className="admin-side">
        <Link href="/admin" className="admin-logo">ذِكر · الإدارة</Link>
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
