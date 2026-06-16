// lib/payments/providers/tap.ts — Tap (Gulf). Charges API; amounts in MAJOR
// units. Webhook verified via HMAC-SHA256 `hashstring`. FAILS CLOSED on any
// mismatch, so a wrong formula can never cause a false "paid". Verify the
// toHash field order in Tap's sandbox before production.
import "server-only";
import crypto from "node:crypto";
import type {
  PaymentProvider, GatewayCredentials, CheckoutParams, CheckoutResult,
  WebhookVerifyInput, WebhookResult, PaymentStatus,
} from "@/lib/payments/types";

const BASE = "https://api.tap.company/v2";

function mapStatus(raw: string | undefined): PaymentStatus {
  switch ((raw ?? "").toUpperCase()) {
    case "CAPTURED": case "PAID": return "paid";
    case "FAILED": case "DECLINED": case "ABANDONED": return "failed";
    case "REFUNDED": return "refunded";
    case "CANCELLED": case "VOID": return "canceled";
    case "INITIATED": case "IN_PROGRESS": return "pending";
    default: return "unknown";
  }
}

export class TapProvider implements PaymentProvider {
  readonly provider = "tap";
  constructor(private creds: GatewayCredentials) {}

  async createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
    const secret = this.creds.secretKey;
    if (!secret) throw new Error("Tap secret key not configured");
    const res = await fetch(`${BASE}/charges`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Number((params.amountCents / 100).toFixed(2)),
        currency: params.currency,
        description: params.description,
        threeDSecure: true,
        customer: params.customerEmail ? { email: params.customerEmail } : undefined,
        source: { id: "src_all" },
        redirect: { url: params.callbackUrl },
        post: { url: params.callbackUrl },
        metadata: { reference_id: params.referenceId },
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Tap charge failed (${res.status}): ${detail.slice(0, 300)}`);
    }
    const data = (await res.json()) as { id?: string; transaction?: { url?: string } };
    const url = data.transaction?.url;
    if (!url) throw new Error("Tap did not return a redirect URL");
    return { redirectUrl: url, providerPaymentId: data.id ?? null };
  }

  async verifyWebhook(input: WebhookVerifyInput): Promise<WebhookResult> {
    const secret = this.creds.webhookSecret || this.creds.secretKey;
    if (!secret) return { valid: false };
    let body: Record<string, unknown>;
    try { body = JSON.parse(input.rawBody); } catch { return { valid: false }; }

    const id = String(body.id ?? "");
    const amount = body.amount != null ? Number(body.amount).toFixed(2) : "";
    const currency = String(body.currency ?? "");
    const status = String(body.status ?? "");
    const ref = (body.reference ?? {}) as Record<string, unknown>;
    const txn = (body.transaction ?? {}) as Record<string, unknown>;
    const created = String(txn.created ?? body.created ?? "");
    const toHash =
      `x_id${id}x_amount${amount}x_currency${currency}` +
      `x_gateway_reference${String(ref.gateway ?? "")}x_payment_reference${String(ref.payment ?? "")}` +
      `x_status${status}x_created${created}`;
    const computed = crypto.createHmac("sha256", secret).update(toHash).digest("hex");
    const provided = (typeof body.hashstring === "string" && body.hashstring) || input.headers.get("hashstring") || "";
    if (provided.length !== computed.length ||
        !crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(computed))) {
      return { valid: false };
    }

    const metadata = (body.metadata ?? {}) as Record<string, unknown>;
    return {
      valid: true,
      eventId: id || null,
      type: status || null,
      status: mapStatus(status),
      providerPaymentId: id || null,
      referenceId: typeof metadata.reference_id === "string" ? metadata.reference_id : null,
      amountCents: body.amount != null ? Math.round(Number(body.amount) * 100) : null,
      currency: currency || null,
    };
  }
}
