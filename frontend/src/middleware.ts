import { type NextRequest, NextResponse } from "next/server";
import { ROUTES } from "@/constants/routes";
import { resolveAuthenticatedRegisterVisit } from "@/lib/invitation-register";
import { getSafeRedirect } from "@/lib/safe-redirect";
import { updateSession } from "@/lib/supabase/middleware";
import { isAuthRoute, isProtectedRoute } from "@/middleware/protected-routes";

/** Preserve refreshed Supabase cookies when issuing a middleware redirect. */
function redirectWithSessionCookies(
  url: URL,
  sessionResponse: NextResponse,
): NextResponse {
  const redirect = NextResponse.redirect(url);
  sessionResponse.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie.name, cookie.value);
  });
  return redirect;
}

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  // Authenticated users hitting the marketing home should enter the app.
  // Also covers Supabase OAuth falling back to Site URL (`/`) after Google login.
  if (user && (pathname === "/" || pathname === ROUTES.home)) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = ROUTES.dashboard;
    dashboardUrl.search = "";
    return redirectWithSessionCookies(dashboardUrl, response);
  }

  if (isProtectedRoute(pathname) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = ROUTES.login;
    const returnTo = `${pathname}${search || ""}`;
    const safeReturn = getSafeRedirect(returnTo);
    loginUrl.search = "";
    if (safeReturn) {
      loginUrl.searchParams.set("redirect", safeReturn);
    }
    return redirectWithSessionCookies(loginUrl, response);
  }

  if (isAuthRoute(pathname) && user) {
    const registerDecision = resolveAuthenticatedRegisterVisit({
      pathname,
      invitedEmail: request.nextUrl.searchParams.get("email"),
      redirectParam: request.nextUrl.searchParams.get("redirect"),
      sessionEmail: user.email,
    });

    if (registerDecision.action === "to_invitation") {
      const invitationUrl = new URL(registerDecision.path, request.nextUrl.origin);
      return redirectWithSessionCookies(invitationUrl, response);
    }

    if (registerDecision.action === "wrong_account") {
      return response;
    }

    // Honor deep-link redirects for already-authenticated users (e.g. invitations).
    const safeRedirect = getSafeRedirect(request.nextUrl.searchParams.get("redirect"));
    if (safeRedirect) {
      const target = new URL(safeRedirect, request.nextUrl.origin);
      return redirectWithSessionCookies(target, response);
    }

    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = ROUTES.dashboard;
    dashboardUrl.search = "";
    return redirectWithSessionCookies(dashboardUrl, response);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
