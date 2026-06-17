// middleware.ts — refresh the Supabase session and gate /admin and /app.
// CRITICAL: this runs on (almost) every request, so it must NEVER throw — a
// failure here 500s the whole site. If Supabase env is missing or the auth call
// errors, we pass the request through untouched (page-level guards still apply).
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED = [/^\/admin(\/|$)/, /^\/app(\/|$)/];

export async function middleware(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Not configured yet → don't block anything, don't crash.
  if (!supabaseUrl || !supabaseKey) return NextResponse.next();

  try {
    let res = NextResponse.next({ request: req });
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          toSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    });
    const { data: { user } } = await supabase.auth.getUser();
    const path = req.nextUrl.pathname;
    if (!user && PROTECTED.some((re) => re.test(path))) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }
    return res;
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
