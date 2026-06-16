// app/api/waitlist/route.ts — public. Rate-limited, validated, honeypot, hashed
// IP, service-role insert (table denies anon/authenticated). Generic responses.
import { type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { waitlistSchema, honeypotTripped } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { hashValue } from "@/lib/crypto/secrets";
import { json, errorJson, handleError } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    if (!rateLimit(`waitlist:${ip}`, 5, 60_000).ok) return errorJson("محاولات كثيرة، حاول لاحقاً", 429);

    const parsed = waitlistSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return errorJson("بيانات غير صالحة", 422);
    if (honeypotTripped(parsed.data)) return json({ ok: true }); // pretend success

    const { error } = await supabaseAdmin().from("waitlist_signups").insert({
      email: parsed.data.email, locale: parsed.data.locale ?? null,
      source: parsed.data.source ?? "landing", ip_hash: hashValue(ip),
    });
    if (error && (error as { code?: string }).code !== "23505") throw error; // dup = ok
    return json({ ok: true });
  } catch (e) { return handleError(e); }
}
