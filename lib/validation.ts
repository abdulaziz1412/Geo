// lib/validation.ts — every input that crosses a trust boundary is parsed here.
import { z } from "zod";

const email = z.string().trim().toLowerCase().email("بريد إلكتروني غير صالح").max(254);
// `company` is a honeypot: hidden in the UI, must stay empty. Bots fill it.
const honeypot = z.string().max(0).optional().or(z.literal("")).optional();

export const waitlistSchema = z.object({
  email,
  locale: z.string().max(10).optional(),
  source: z.string().max(60).optional(),
  company: honeypot,
});

export const contactSchema = z.object({
  name: z.string().trim().min(1, "الاسم مطلوب").max(100),
  email,
  message: z.string().trim().min(1, "الرسالة مطلوبة").max(5000),
  company: honeypot,
});

export const gatewayUpsertSchema = z.object({
  provider: z.enum(["moyasar", "tap", "stripe", "paytabs", "hyperpay"]),
  display_name: z.string().trim().min(1).max(80),
  mode: z.enum(["test", "live"]).default("test"),
  publishable_key: z.string().trim().max(500).optional().nullable(),
  secret_key: z.string().trim().max(2000).optional().nullable(),
  webhook_secret: z.string().trim().max(2000).optional().nullable(),
  is_active: z.boolean().default(false),
});

export const checkoutSchema = z.object({
  org_id: z.string().uuid(),
  plan_code: z.string().trim().min(1).max(40),
});

export const ticketSchema = z.object({
  org_id: z.string().uuid(),
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(10000),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
});

export const ticketReplySchema = z.object({
  ticket_id: z.string().uuid(),
  body: z.string().trim().min(1).max(10000),
});

export const ticketAdminUpdateSchema = z.object({
  status: z.enum(["open", "pending", "resolved", "closed"]).optional(),
  body: z.string().trim().min(1).max(10000).optional(),
});

export const planUpsertSchema = z.object({
  code: z.string().trim().min(1).max(40),
  tier: z.enum(["free", "starter", "pro", "agency"]),
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(300).optional().nullable(),
  price_cents: z.number().int().min(0),
  currency: z.string().length(3).default("SAR"),
  billing_interval: z.enum(["month", "year", "once"]).default("month"),
  features: z.array(z.string().max(120)).max(20).default([]),
  limits: z.record(z.string(), z.number().int().min(0)).default({}),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});

export function honeypotTripped(input: { company?: string | null }): boolean {
  return typeof input.company === "string" && input.company.length > 0;
}
