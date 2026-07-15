import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { ROUTES } from "@/constants/routes";

/**
 * OAuth / email verification / password reset callback handler.
 * Exchanges the auth code for a session and redirects to the target page.
 *
 * Configure redirect URL in Supabase Dashboard:
 *   Authentication → URL Configuration → Redirect URLs
 *   http://localhost:3000/auth/callback
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? ROUTES.dashboard;
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (errorParam) {
    const loginUrl = new URL(ROUTES.login, origin);
    loginUrl.searchParams.set(
      "error",
      errorDescription ?? errorParam,
    );
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(`${ROUTES.login}?error=missing_auth_code`, origin),
    );
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const loginUrl = new URL(ROUTES.login, origin);
    loginUrl.searchParams.set("error", error.message);
    return NextResponse.redirect(loginUrl);
  }

  const safeNext = next.startsWith("/") ? next : ROUTES.dashboard;
  return NextResponse.redirect(new URL(safeNext, origin));
}
