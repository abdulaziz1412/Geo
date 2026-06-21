// app/app/page.tsx — dashboard overview: plan, projects, create form.
import Link from "next/link";
import { getPrimaryOrg } from "@/lib/org";
import { getOrgLimits } from "@/lib/plan";
import { supabaseServer } from "@/lib/supabase/server";
import NewProjectForm from "./NewProjectForm";

export const dynamic = "force-dynamic";

const PLAN_NAMES: Record<string, string> = {
  free: "مجاني", starter: "المبتدئ", pro: "الاحترافي", agency: "الوكالات",
};

interface ProjectRow { id: string; business_name: string; domain: string | null; created_at: string; }

export default async function AppHome() {
  const org = await getPrimaryOrg();
  if (!org) {
    return (
      <section>
        <h1 className="admin-h1">مرحباً</h1>
        <p className="admin-note">لا توجد مؤسسة مرتبطة بحسابك. أعد تسجيل الدخول، أو أنشئ حساباً جديداً من صفحة التسجيل.</p>
      </section>
    );
  }
  const sb = await supabaseServer();
  const { data } = await sb
    .from("projects").select("id, business_name, domain, created_at")
    .eq("org_id", org.id).order("created_at", { ascending: false });
  const projects = (data ?? []) as ProjectRow[];
  const limits = await getOrgLimits(org.id);

  return (
    <section>
      <h1 className="admin-h1">نظرة عامة</h1>
      <div className="admin-cards">
        <div className="admin-card">
          <div className="admin-card-value">{PLAN_NAMES[org.plan] ?? org.plan}</div>
          <div className="admin-card-label">باقتك الحالية</div>
        </div>
        <div className="admin-card">
          <div className="admin-card-value">{projects.length} / {limits.max_projects}</div>
          <div className="admin-card-label">المشاريع</div>
        </div>
        <div className="admin-card" style={{ display: "flex", alignItems: "center" }}>
          <Link href="/pricing" className="btn btn-primary">ترقية الباقة</Link>
        </div>
      </div>

      <h2 className="admin-h2">مشاريعك</h2>
      {projects.length === 0 && (
        <p className="admin-note">لا توجد مشاريع بعد. أنشئ أول مشروع لبدء تحليل ظهور علامتك في محرّكات الذكاء الاصطناعي.</p>
      )}
      <div className="admin-cards">
        {projects.map((p) => (
          <Link key={p.id} href={`/app/projects/${p.id}`} className="admin-card" style={{ textDecoration: "none" }}>
            <div className="admin-card-value" style={{ fontSize: "1.1rem" }}>{p.business_name}</div>
            <div className="admin-card-label" dir="ltr">{p.domain ?? "—"}</div>
          </Link>
        ))}
      </div>

      <h2 className="admin-h2">مشروع جديد</h2>
      <NewProjectForm orgId={org.id} canCreate={projects.length < limits.max_projects} maxProjects={limits.max_projects} />
    </section>
  );
}
