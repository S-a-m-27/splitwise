import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { ROUTES } from "@/constants/routes";
import { authServerService } from "@/features/auth/services/auth.service.server";
import { getSafeRedirect } from "@/lib/safe-redirect";

/**
 * Resolves a post-OAuth / email-link in-app path.
 * Allows password-recovery destination; rejects open redirects and auth loops.
 */
function resolveCallbackNext(next: string | null): string {
  return (
    getSafeRedirect(next, { allowPaths: [ROUTES.resetPassword] }) ?? ROUTES.dashboard
  );
}

/**
 * OAuth / email verification / password reset callback handler.
 * Exchanges the auth code for a session, ensures a profile exists, then redirects.
 *
 * Configure redirect URL in Supabase Dashboard:
 *   Authentication → URL Configuration → Redirect URLs
 *   http://localhost:3000/auth/callback
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const authCode = searchParams.get("code");
  const next = resolveCallbackNext(searchParams.get("next"));
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (errorParam) {
    const loginUrl = new URL(ROUTES.login, origin);
    const lowered = (errorDescription ?? errorParam).toLowerCase();
    const friendlyCode =
      lowered.includes("access_denied") ||
      lowered.includes("cancel") ||
      lowered.includes("denied")
        ? "oauth_cancelled"
        : "oauth_failed";
    loginUrl.searchParams.set("error", friendlyCode);
    return NextResponse.redirect(loginUrl);
  }

  if (!authCode) {
    return NextResponse.redirect(
      new URL(`${ROUTES.login}?error=oauth_failed`, origin),
    );
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(authCode);

  if (error) {
    const loginUrl = new URL(ROUTES.login, origin);
    loginUrl.searchParams.set("error", "oauth_failed");
    return NextResponse.redirect(loginUrl);
  }

  // Idempotent profile bootstrap (safe under retries / multi-tab).
  // Failure must not block sign-in — client sync will retry ensure.
  try {
    await authServerService.ensureProfile();
  } catch {
    // Intentionally swallow — session is already established.
  }

  return NextResponse.redirect(new URL(next, origin));
}
