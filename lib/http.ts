// lib/http.ts
import { NextResponse, type NextRequest } from "next/server";
import { AuthError } from "@/lib/auth/guards";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorJson(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

// Map thrown errors to a safe response (never leak internals to clients).
export function handleError(err: unknown) {
  if (err instanceof AuthError) return errorJson(err.message, err.status);
  console.error("[api] unhandled error:", err);
  return errorJson("حدث خطأ غير متوقّع", 500);
}

// Same-origin guard for state-changing requests (CSRF defense-in-depth on top
// of SameSite=Lax auth cookies).
export function assertSameOrigin(req: NextRequest): void {
  const origin = req.headers.get("origin") ?? req.headers.get("referer");
  if (!origin) return; // same-origin fetches may omit Origin; cookies are SameSite=Lax
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new AuthError("أصل الطلب غير صالح", 403);
  }
  if (originHost !== req.headers.get("host")) {
    throw new AuthError("أصل الطلب غير مطابق", 403);
  }
}

// Sanitize a post-login "next" target to an internal path (blocks open-redirects).
export function safeNextPath(next: string | null | undefined, fallback = "/app"): string {
  if (!next) return fallback;
  if (next.startsWith("//")) return fallback;
  if (!/^\/[A-Za-z0-9/_\-?=&.%]*$/.test(next)) return fallback;
  return next;
}
