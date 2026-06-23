// lib/i18n.ts — server-only i18n entry. Re-exports the client-safe dictionary
// and adds getLocale() (reads the cookie via next/headers). Import this from
// SERVER components only; client components import from "@/lib/dict".
import { cookies } from "next/headers";
import { LOCALE_COOKIE, type Locale } from "./dict";

export * from "./dict";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return store.get(LOCALE_COOKIE)?.value === "en" ? "en" : "ar";
}
