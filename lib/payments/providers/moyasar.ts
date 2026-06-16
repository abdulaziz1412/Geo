// lib/payments/providers/moyasar.ts — Moyasar (Saudi). Invoices API; amounts in
// halalas (matches our price_cents). Webhook verified via the dashboard
// secret_token. Docs: https://docs.moyasar.com — verify in test mode first.
import "server-only";
import { safeEqual } from "@/lib/crypto/secrets";
import type {
  PaymentProvider, GatewayCredentials, CheckoutParams, CheckoutResult,
  WebhookVerifyInput, WebhookResult, PaymentStatus,
} from "@/lib/payments/types";

const BASE = "https://api.moyasar.com/v1";

function basicAuth(secretKey: string): string {
  return "Basic " + Buffer.from(`${secretKey}:`).toString("base64");
}

function mapStatus(raw: string | undefined): PaymentStatus {
  switch ((raw ?? "").toLowerCase()) {
    case "paid": return "paid";
    case "failed": return "failed";
    case "refunded": return "refunded";
    case "voided": case "canceled": case "cancelled": return "canceled";
    case "initiated": case "pending": return "pending";
    default: return "unknown";
  }
}

export class MoyasarProvider implements PaymentProvider {
  readonly provider = "moyasar";
  constructor(private creds: GatewayCredentials) {}

  async createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
    const secret = this.creds.secretKey;
    if (!secret) throw new Error("Moyasar secret key not configured");
    const res = await fetch(`${BASE}/invoices`, {
      method: "POST",
      headers: { Authorization: basicAuth(secret), "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: params.amountCents,
        currency: params.currency,
        description: params.description,
        callback_url: params.callbackUrl,
        success_url: params.callbackUrl,
        metadata: { reference_id: params.referenceId },
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Moyasar invoice failed (${res.status}): ${detail.slice(0, 300)}`);
    }
    const data = (await res.json()) as { id?: string; url?: string };
    if (!data.url) throw new Error("Moyasar did not return a payment URL");
    return { redirectUrl: data.url, providerPaymentId: data.id ?? null };
  }

  async verifyWebhook(input: WebhookVerifyInput): Promise<WebhookResult> {
    let body: Record<string, unknown>;
    try { body = JSON.parse(input.rawBody); } catch { return { valid: false }; }
    const provided = typeof body.secret_token === "string" ? body.secret_token : "";
    const expected = this.creds.webhookSecret ?? "";
    if (expected.length === 0 || !safeEqual(provided, expected)) return { valid: false };

    const data = (body.data ?? {}) as Record<string, unknown>;
    const metadata = (data.metadata ?? {}) as Record<string, unknown>;
    return {
      valid: true,
      eventId: typeof body.id === "string" ? body.id : (typeof data.id === "string" ? data.id : null),
      type: typeof body.type === "string" ? body.type : null,
      status: mapStatus(typeof data.status === "string" ? data.status : undefined),
      providerPaymentId: typeof data.id === "string" ? data.id : null,
      referenceId: typeof metadata.reference_id === "string" ? metadata.reference_id : null,
      amountCents: typeof data.amount === "number" ? data.amount : null,
      currency: typeof data.currency === "string" ? data.currency : null,
    };
  }
}
