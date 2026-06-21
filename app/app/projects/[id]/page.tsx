// app/app/projects/[id]/page.tsx — project detail + audit results.
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import ProjectPanel from "./ProjectPanel";

export const dynamic = "force-dynamic";

interface EngineStat { total: number; mentioned: number; cited: number; }

export default async function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await supabaseServer();

  const { data: project } = await sb
    .from("projects").select("id, business_name, domain, industry").eq("id", id).maybeSingle();
  if (!project) notFound();

  const { data: promptRows } = await sb
    .from("prompts").select("id, text").eq("project_id", id).order("created_at", { ascending: false });
  const prompts = (promptRows ?? []) as { id: string; text: string }[];

  const { data: runRows } = await sb
    .from("audit_runs").select("id, status, created_at").eq("project_id", id)
    .order("created_at", { ascending: false }).limit(1);
  const latest = (runRows ?? [])[0] as { id: string; status: string } | undefined;

  type ResultRow = {
    mentioned: boolean; cited: boolean; share_of_voice: number | null;
    competitors: unknown; citations: unknown; engines: { display_name: string } | null;
  };
  let results: ResultRow[] = [];
  if (latest && latest.status === "completed") {
    const { data } = await sb
      .from("audit_results")
      .select("mentioned, cited, share_of_voice, competitors, citations, engines(display_name)")
      .eq("run_id", latest.id);
    results = (data ?? []) as unknown as ResultRow[];
  }

  const total = results.length;
  const mentioned = results.filter((r) => r.mentioned).length;
  const cited = results.filter((r) => r.cited).length;
  const visibility = total ? Math.round((100 * mentioned) / total) : 0;
  const citationRate = total ? Math.round((100 * cited) / total) : 0;
  const avgSov = total
    ? Math.round(results.reduce((s, r) => s + Number(r.share_of_voice ?? 0), 0) / total)
    : 0;

  const byEngine: Record<string, EngineStat> = {};
  for (const r of results) {
    const name = r.engines?.display_name ?? "—";
    const e = (byEngine[name] ??= { total: 0, mentioned: 0, cited: 0 });
    e.total += 1;
    if (r.mentioned) e.mentioned += 1;
    if (r.cited) e.cited += 1;
  }

  const compCount: Record<string, number> = {};
  for (const r of results) {
    if (Array.isArray(r.competitors)) {
      for (const c of r.competitors) {
        const n = String(c).trim();
        if (n) compCount[n] = (compCount[n] ?? 0) + 1;
      }
    }
  }
  const topComp = Object.entries(compCount).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const recs: string[] = [];
  if (total === 0) {
    recs.push("أضف أسئلة مستهدفة ثم شغّل أول تدقيق لرؤية نتائج ظهورك.");
  } else {
    if (visibility < 50) recs.push("ظهور علامتك منخفض — أنشئ محتوى يجيب مباشرةً على الأسئلة المستهدفة (صفحات أسئلة شائعة ومقارنات).");
    if (citationRate < visibility) recs.push("علامتك تُذكر لكن نادراً ما تُستشهد كمصدر — انشر محتوى موثوقاً بمعلومات قابلة للاقتباس وبيانات منظّمة.");
    for (const [name, s] of Object.entries(byEngine)) {
      if (s.mentioned === 0) recs.push(`لا ظهور في ${name} — استهدف هذا المحرّك بمحتوى ملائم.`);
    }
    if (topComp.length > 0) recs.push(`منافسون يظهرون بكثرة: ${topComp.slice(0, 3).map((c) => c[0]).join("، ")} — حلّل محتواهم وتفوّق عليه.`);
  }

  return (
    <section>
      <Link href="/app" className="admin-back">→ كل المشاريع</Link>
      <h1 className="admin-h1">{project.business_name}</h1>
      <p className="admin-note" dir="auto">
        {project.domain ?? ""}{project.industry ? ` · ${project.industry}` : ""}
      </p>

      <div className="admin-cards">
        <div className="admin-card">
          <div className="admin-card-value" style={{ color: visibility >= 50 ? "#1a7a44" : "#9a6b00" }}>{visibility}%</div>
          <div className="admin-card-label">درجة الظهور</div>
        </div>
        <div className="admin-card"><div className="admin-card-value">{citationRate}%</div><div className="admin-card-label">معدّل الاستشهاد</div></div>
        <div className="admin-card"><div className="admin-card-value">{avgSov}%</div><div className="admin-card-label">حصّة الصوت</div></div>
        <div className="admin-card">
          <div className="admin-card-value">{latest ? (latest.status === "completed" ? "مكتمل" : latest.status) : "—"}</div>
          <div className="admin-card-label">آخر تدقيق</div>
        </div>
      </div>

      <ProjectPanel projectId={project.id} prompts={prompts} hasPrompts={prompts.length > 0} />

      {total > 0 && (
        <>
          <h2 className="admin-h2">حسب المحرّك</h2>
          <table className="admin-table">
            <thead><tr><th>المحرّك</th><th>الذِّكر</th><th>الاستشهاد</th><th>العيّنات</th></tr></thead>
            <tbody>
              {Object.entries(byEngine).map(([name, s]) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{Math.round((100 * s.mentioned) / s.total)}%</td>
                  <td>{Math.round((100 * s.cited) / s.total)}%</td>
                  <td>{s.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {topComp.length > 0 && (
        <>
          <h2 className="admin-h2">المنافسون الأكثر ظهوراً</h2>
          <p className="admin-note">{topComp.map((c) => `${c[0]} (${c[1]})`).join("، ")}</p>
        </>
      )}

      <h2 className="admin-h2">توصيات</h2>
      <ul style={{ lineHeight: 2, color: "var(--geo-muted)", paddingRight: 20 }}>
        {recs.map((r, i) => <li key={i}>{r}</li>)}
      </ul>
    </section>
  );
}
