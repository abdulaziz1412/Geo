// lib/payments/types.ts — provider-agnostic contract.
export type PaymentStatus = "paid" | "failed" | "pending" | "refunded" | "canceled" | "unknown";

export interface GatewayCredentials {
  provider: string;
  mode: "test" | "live";
  publishableKey?: string | null;
  secretKey?: string | null;       // decrypted in memory only
  webhookSecret?: string | null;   // decrypted in memory only
}

export interface CheckoutParams {
  amountCents: number;
  currency: string;
  description: string;
  referenceId: string;             // our payments.id, echoed via gateway metadata
  callbackUrl: string;
  customerEmail?: string | null;
}

export interface CheckoutResult {
  redirectUrl: string;
  providerPaymentId?: string | null;
}

export interface WebhookVerifyInput {
  rawBody: string;
  headers: Headers;
}

export interface WebhookResult {
  valid: boolean;                  // true ONLY if signature/secret verified — fail closed
  eventId?: string | null;
  type?: string | null;
  status?: PaymentStatus;
  providerPaymentId?: string | null;
  referenceId?: string | null;
  amountCents?: number | null;
  currency?: string | null;
}

export interface PaymentProvider {
  readonly provider: string;
  createCheckout(params: CheckoutParams): Promise<CheckoutResult>;
  verifyWebhook(input: WebhookVerifyInput): Promise<WebhookResult>;
}
