// lib/payments/index.ts — loads the active gateway, decrypts secrets in server
// memory only at point of use, and returns the matching provider.
import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { decryptSecret } from "@/lib/crypto/secrets";
import type { PaymentProvider, GatewayCredentials } from "./types";
import { MoyasarProvider } from "./providers/moyasar";
import { TapProvider } from "./providers/tap";

export const IMPLEMENTED_PROVIDERS = ["moyasar", "tap"] as const;
const COLS = "provider, mode, publishable_key, secret_key_enc, webhook_secret_enc, is_active";

interface GatewayRow {
  provider: string;
  mode: "test" | "live";
  publishable_key: string | null;
  secret_key_enc: string | null;
  webhook_secret_enc: string | null;
  is_active: boolean;
}

function toCredentials(row: GatewayRow): GatewayCredentials {
  return {
    provider: row.provider,
    mode: row.mode,
    publishableKey: row.publishable_key,
    secretKey: row.secret_key_enc ? decryptSecret(row.secret_key_enc) : null,
    webhookSecret: row.webhook_secret_enc ? decryptSecret(row.webhook_secret_enc) : null,
  };
}

function instantiate(creds: GatewayCredentials): PaymentProvider {
  switch (creds.provider) {
    case "moyasar": return new MoyasarProvider(creds);
    case "tap": return new TapProvider(creds);
    default: throw new Error(`مزوّد الدفع غير مدعوم بعد: ${creds.provider}`);
  }
}

export async function getActiveGateway(): Promise<PaymentProvider | null> {
  const { data, error } = await supabaseAdmin()
    .from("payment_gateways").select(COLS).eq("is_active", true).maybeSingle();
  if (error || !data) return null;
  return instantiate(toCredentials(data as GatewayRow));
}

export async function getGatewayByProvider(provider: string): Promise<PaymentProvider | null> {
  const { data, error } = await supabaseAdmin()
    .from("payment_gateways").select(COLS).eq("provider", provider).maybeSingle();
  if (error || !data) return null;
  return instantiate(toCredentials(data as GatewayRow));
}
