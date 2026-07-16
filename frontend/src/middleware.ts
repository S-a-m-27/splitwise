import { type NextRequest, NextResponse } from "next/server";
import { ROUTES } from "@/constants/routes";
import { resolveAuthenticatedRegisterVisit } from "@/lib/invitation-register";
import { updateSession } from "@/lib/supabase/middleware";
import { isAuthRoute, isProtectedRoute } from "@/middleware/protected-routes";

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (isProtectedRoute(pathname) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = ROUTES.login;
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
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
      return NextResponse.redirect(invitationUrl);
    }

    if (registerDecision.action === "wrong_account") {
      return response;
    }

    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = ROUTES.dashboard;
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
