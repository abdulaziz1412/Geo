// app/api/admin/payment-gateways/route.ts
import { type NextRequest } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { encryptSecret } from "@/lib/crypto/secrets";
import { gatewayUpsertSchema } from "@/lib/validation";
import { json, errorJson, handleError, assertSameOrigin } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// List gateways. Secrets are NEVER returned — only booleans + the publishable key.
export async function GET() {
  try {
    await requirePlatformAdmin();
    const { data, error } = await supabaseAdmin()
      .from("payment_gateways")
      .select("id, provider, display_name, mode, publishable_key, secret_key_enc, webhook_secret_enc, is_active, updated_at")
      .order("provider");
    if (error) throw error;
    const gateways = (data ?? []).map((g) => ({
      id: g.id, provider: g.provider, display_name: g.display_name, mode: g.mode,
      publishable_key: g.publishable_key,
      has_secret_key: Boolean(g.secret_key_enc),
      has_webhook_secret: Boolean(g.webhook_secret_enc),
      is_active: g.is_active, updated_at: g.updated_at,
    }));
    return json({ ok: true, gateways });
  } catch (e) { return handleError(e); }
}

// Upsert a gateway. Secrets encrypted before storage; blank = keep existing.
export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const admin = await requirePlatformAdmin();
    const parsed = gatewayUpsertSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return errorJson(parsed.error.issues[0]?.message ?? "مدخلات غير صالحة", 422);
    const v = parsed.data;
    const db = supabaseAdmin();

    const { data: existing } = await db
      .from("payment_gateways").select("secret_key_enc, webhook_secret_enc")
      .eq("provider", v.provider).maybeSingle();

    const row: Record<string, unknown> = {
      provider: v.provider, display_name: v.display_name, mode: v.mode,
      publishable_key: v.publishable_key ?? null, is_active: v.is_active,
    };
    const newSecret = v.secret_key?.trim();
    row.secret_key_enc = newSecret ? encryptSecret(newSecret) : existing?.secret_key_enc ?? null;
    const newWebhook = v.webhook_secret?.trim();
    row.webhook_secret_enc = newWebhook ? encryptSecret(newWebhook) : existing?.webhook_secret_enc ?? null;

    if (v.is_active) {
      await db.from("payment_gateways").update({ is_active: false }).neq("provider", v.provider);
    }
    const { error } = await db.from("payment_gateways").upsert(row, { onConflict: "provider" });
    if (error) throw error;

    await db.from("admin_audit_log").insert({
      actor_id: admin.id, action: "payment_gateway.upsert", target: v.provider,
      metadata: { mode: v.mode, is_active: v.is_active, secret_updated: Boolean(newSecret), webhook_updated: Boolean(newWebhook) },
    });
    return json({ ok: true });
  } catch (e) { return handleError(e); }
}
