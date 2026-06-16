// app/billing/return/page.tsx — where the gateway returns the buyer. Shows a
// generic status by payment id (UUID is unguessable; no sensitive details shown).
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function BillingReturn({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  let status = "unknown";
  if (ref && /^[0-9a-f-]{36}$/i.test(ref)) {
    const { data } = await supabaseAdmin().from("payments").select("status").eq("id", ref).maybeSingle();
    status = data?.status ?? "unknown";
  }
  const map: Record<string, { t: string; d: string }> = {
    paid: { t: "تم الدفع بنجاح ✅", d: "تم تفعيل اشتراكك. شكراً لك!" },
    pending: { t: "جارٍ تأكيد الدفع…", d: "قد يستغرق التأكيد لحظات. سنحدّث اشتراكك تلقائياً." },
    failed: { t: "تعذّرت عملية الدفع", d: "لم يكتمل الدفع. يمكنك المحاولة مرة أخرى." },
    canceled: { t: "أُلغيت العملية", d: "تم إلغاء الدفع." },
    unknown: { t: "حالة غير معروفة", d: "تعذّر تحديد حالة الدفع." },
  };
  const s = map[status] ?? map.unknown;
  return (
    <main className="auth-wrap">
      <div className="auth-card">
        <h1 className="auth-title">{s.t}</h1>
        <p>{s.d}</p>
        <Link className="btn btn-primary" href="/app">الذهاب إلى لوحة التحكم</Link>
      </div>
    </main>
  );
}
