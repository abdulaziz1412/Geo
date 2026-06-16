// lib/auth/guards.ts
// Server-side authorization helpers — defense-in-depth ON TOP of RLS.
import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { User } from "@supabase/supabase-js";

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

// getUser() re-validates the token with Supabase — never trust getSession() alone.
export async function getUser(): Promise<User | null> {
  const sb = await supabaseServer();
  const { data, error } = await sb.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}

export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) throw new AuthError("يجب تسجيل الدخول أولاً", 401);
  return user;
}

// Authoritative platform-staff check, read through the service role.
export async function isPlatformAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin()
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return false;
  return Boolean(data);
}

export async function requirePlatformAdmin(): Promise<User> {
  const user = await requireUser();
  if (!(await isPlatformAdmin(user.id))) {
    throw new AuthError("هذه الصفحة مخصّصة لطاقم المنصّة", 403);
  }
  return user;
}

// Confirm org membership using the user's RLS client (row is invisible if not a member).
export async function requireOrgMembership(orgId: string): Promise<User> {
  const user = await requireUser();
  const sb = await supabaseServer();
  const { data, error } = await sb.from("organizations").select("id").eq("id", orgId).maybeSingle();
  if (error || !data) throw new AuthError("لا تملك صلاحية على هذه المؤسسة", 403);
  return user;
}
