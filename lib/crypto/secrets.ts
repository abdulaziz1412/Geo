// lib/crypto/secrets.ts
// Application-layer encryption for payment-provider secrets.
//
// The encryption key lives ONLY in the server runtime env
// (SETTINGS_ENCRYPTION_KEY). Postgres — and any DB dump, backup, or leaked
// service-role read — never sees the key or the plaintext.
//
// Format:  v1.<iv_b64>.<tag_b64>.<ciphertext_b64>   (AES-256-GCM, 96-bit IV)
import "server-only";
import crypto from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const VERSION = "v1";

function getKey(): Buffer {
  const raw = process.env.SETTINGS_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("SETTINGS_ENCRYPTION_KEY is missing. Generate one with: openssl rand -base64 32");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("SETTINGS_ENCRYPTION_KEY must decode to exactly 32 bytes (use: openssl rand -base64 32)");
  }
  return key;
}

export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64"), tag.toString("base64"), ciphertext.toString("base64")].join(".");
}

export function decryptSecret(token: string): string {
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== VERSION) throw new Error("Invalid ciphertext format");
  const iv = Buffer.from(parts[1], "base64");
  const tag = Buffer.from(parts[2], "base64");
  const ciphertext = Buffer.from(parts[3], "base64");
  const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

export function maskSecret(value: string | null | undefined): string | null {
  if (!value) return null;
  return `••••••••${value.slice(-4)}`;
}

// Keyed (HMAC-SHA256) hash for storing request IPs without the raw value.
export function hashValue(value: string): string {
  const salt = process.env.SETTINGS_ENCRYPTION_KEY ?? "geo-insecure-fallback-salt";
  return crypto.createHmac("sha256", salt).update(value).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}
