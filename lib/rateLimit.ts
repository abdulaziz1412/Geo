// lib/rateLimit.ts — fixed-window limiter.
// NOTE: in-memory / per-instance. On serverless each instance counts
// separately, so this slows abuse but isn't a global guarantee. For strict
// limits, back with Upstash Redis (see docs/SECURITY.md).
import type { NextRequest } from "next/server";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export interface RateLimitResult { ok: boolean; remaining: number; resetAt: number }

export function rateLimit(key: string, limit = 5, windowMs = 60_000): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt < now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt };
  }
  existing.count += 1;
  return { ok: existing.count <= limit, remaining: Math.max(0, limit - existing.count), resetAt: existing.resetAt };
}

export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "0.0.0.0";
}

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
  }, 5 * 60_000).unref?.();
}
