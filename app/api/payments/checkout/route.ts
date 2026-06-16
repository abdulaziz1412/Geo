// app/api/payments/checkout/route.ts
// Signed-in org members start a purchase. Membership is verified UNDER RLS; the
// price comes from the DB (server-trusted), never the request body.
import { type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getActiveGateway } from "@/lib/payments";
import { checkoutSchema } from "@/lib/validation";
import { json, errorJson, handleError, assertSameOrigin } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function appUrl(req: NextRequest): string {
  return (process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin).replace(/\/$/, "");
}

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const user = await requireUser();
    const parsed = checkoutSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return errorJson("مدخلات غير صالحة", 422);
    const { org_id, plan_code } = parsed.data;

    // Membership enforced by RLS — invisible row if not a member.
    const sb = await supabaseServer();
    const { data: org } = await sb.from("organizations").select("id").eq("id", org_id).maybeSingle();
    if (!org) return errorJson("لا تملك صلاحية على هذه المؤسسة", 403);

    const db = supabaseAdmin();
    const { data: plan } = await db
      .from("plans").select("id, code, tier, name, price_cents, currency, is_active")
      .eq("code", plan_code).maybeSingle();
    if (!plan || !plan.is_active) return errorJson("الباقة غير متاحة", 404);

    // Free plan: no payment — set entitlement via service role and finish.
    if (plan.price_cents === 0) {
      await db.from("subscriptions").upsert(
        { org_id, plan: plan.tier, plan_id: plan.id, status: "active", provider: "manual", started_at: new Date().toISOString() },
        { onConflict: "org_id" },
      );
      await db.from("organizations").update({ plan: plan.tier }).eq("id", org_id);
      return json({ ok: true, free: true, redirectUrl: `${appUrl(req)}/app` });
    }

    const gateway = await getActiveGateway();
    if (!gateway) return errorJson("لا توجد بوّابة دفع مفعّلة. تواصل مع الدعم.", 503);

    const { data: payment, error: payErr } = await db.from("payments").insert({
      org_id, plan_id: plan.id, provider: gateway.provider, amount_cents: plan.price_cents,
      currency: plan.currency, status: "initiated", description: `اشتراك ${plan.name}`,
      metadata: { plan_code: plan.code, user_id: user.id },
    }).select("id").single();
    if (payErr || !payment) throw payErr ?? new Error("payment insert failed");

    const checkout = await gateway.createCheckout({
      amountCents: plan.price_cents, currency: plan.currency, description: `اشتراك ${plan.name}`,
      referenceId: payment.id, callbackUrl: `${appUrl(req)}/billing/return?ref=${payment.id}`,
      customerEmail: user.email ?? null,
    });

    await db.from("payments").update({
      status: "pending", provider_payment_id: checkout.providerPaymentId ?? null,
    }).eq("id", payment.id);

    return json({ ok: true, redirectUrl: checkout.redirectUrl });
  } catch (e) { return handleError(e); }
}
