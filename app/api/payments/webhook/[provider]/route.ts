// app/api/payments/webhook/[provider]/route.ts
// Gateways call this server-to-server. (1) read raw body, (2) verify signature,
// (3) idempotency via unique (provider,event_id), (4) only a verified, first-seen
// "paid" event activates a subscription. All writes via the service role.
import { type NextRequest } from "next/server";
import { getGatewayByProvider } from "@/lib/payments";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { json, errorJson } from "@/lib/http";
import type { WebhookResult } from "@/lib/payments/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeJson(raw: string): unknown {
  try { return JSON.parse(raw); } catch { return { raw: raw.slice(0, 2000) }; }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  const rawBody = await req.text();

  const gateway = await getGatewayByProvider(provider);
  if (!gateway) return errorJson("بوّابة غير معروفة", 404);

  let result: WebhookResult;
  try {
    result = await gateway.verifyWebhook({ rawBody, headers: req.headers });
  } catch {
    result = { valid: false };
  }

  const db = supabaseAdmin();

  // Log EVERY event (valid or not) — idempotency + tamper audit.
  const { error: insErr } = await db.from("webhook_events").insert({
    provider, event_id: result.eventId ?? null, type: result.type ?? null,
    signature_valid: result.valid, payload: safeJson(rawBody),
  });
  if (insErr && (insErr as { code?: string }).code === "23505") {
    return json({ ok: true, duplicate: true }); // already processed
  }

  // Reject invalid AFTER logging — never act on an unverified event.
  if (!result.valid) return errorJson("توقيع غير صالح", 400);

  if (result.status === "paid" && result.referenceId) {
    await activatePaidPayment(result.referenceId, result);
  } else if (result.referenceId && ["failed", "canceled", "refunded"].includes(result.status ?? "")) {
    await db.from("payments").update({ status: result.status }).eq("id", result.referenceId);
  }

  await db.from("webhook_events").update({ processed_at: new Date().toISOString() })
    .eq("provider", provider).eq("event_id", result.eventId ?? "");
  return json({ ok: true });
}

async function activatePaidPayment(paymentId: string, result: WebhookResult) {
  const db = supabaseAdmin();
  const { data: payment } = await db.from("payments")
    .select("id, org_id, plan_id, amount_cents, currency, status").eq("id", paymentId).maybeSingle();
  if (!payment) return;
  if (payment.status === "paid") return; // idempotent

  // Anti-tamper: the gateway's amount must match what we charged.
  if (result.amountCents != null && result.amountCents !== payment.amount_cents) {
    await db.from("payments").update({
      status: "failed", metadata: { amount_mismatch: true, reported: result.amountCents },
    }).eq("id", paymentId);
    return;
  }

  await db.from("payments").update({
    status: "paid", provider_payment_id: result.providerPaymentId ?? null,
  }).eq("id", paymentId);

  const { data: plan } = await db.from("plans").select("tier").eq("id", payment.plan_id).maybeSingle();
  const tier = plan?.tier ?? "starter";
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const { data: sub } = await db.from("subscriptions").upsert(
    {
      org_id: payment.org_id, plan: tier, plan_id: payment.plan_id, status: "active",
      provider: "gateway", currency: payment.currency,
      started_at: new Date().toISOString(), current_period_end: periodEnd.toISOString(),
    },
    { onConflict: "org_id" },
  ).select("id").single();

  await db.from("organizations").update({ plan: tier }).eq("id", payment.org_id);

  const number = `INV-${new Date().getFullYear()}-${payment.id.slice(0, 8).toUpperCase()}`;
  await db.from("invoices").insert({
    org_id: payment.org_id, subscription_id: sub?.id ?? null, payment_id: payment.id,
    number, amount_cents: payment.amount_cents, currency: payment.currency,
    status: "paid", paid_at: new Date().toISOString(),
    line_items: [{ description: "Subscription", amount_cents: payment.amount_cents }],
  });
}
