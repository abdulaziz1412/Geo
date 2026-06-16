// app/api/contact/route.ts — public. Same defenses as the waitlist route.
import { type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { contactSchema, honeypotTripped } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { hashValue } from "@/lib/crypto/secrets";
import { json, errorJson, handleError } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    if (!rateLimit(`contact:${ip}`, 3, 60_000).ok) return errorJson("محاولات كثيرة، حاول لاحقاً", 429);

    const parsed = contactSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return errorJson("بيانات غير صالحة", 422);
    if (honeypotTripped(parsed.data)) return json({ ok: true });

    const { error } = await supabaseAdmin().from("contact_messages").insert({
      name: parsed.data.name, email: parsed.data.email, message: parsed.data.message,
      ip_hash: hashValue(ip),
    });
    if (error) throw error;
    return json({ ok: true });
  } catch (e) { return handleError(e); }
}
