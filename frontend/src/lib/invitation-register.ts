import { ROUTES } from "@/constants/routes";
import { getSafeRedirect } from "@/lib/safe-redirect";

export type AuthenticatedRegisterDecision =
  | { action: "to_invitation"; path: string }
  | { action: "wrong_account"; invitedEmail: string; redirectPath: string }
  | { action: "to_dashboard" };

function normalizeEmail(email: string | null | undefined): string | null {
  const trimmed = email?.trim().toLowerCase();
  return trimmed || null;
}

/**
 * When an authenticated user opens /register from an invitation email,
 * decide whether to send them to the invitation or allow sign-up (wrong email).
 */
export function resolveAuthenticatedRegisterVisit(input: {
  pathname: string;
  invitedEmail: string | null;
  redirectParam: string | null;
  sessionEmail: string | null | undefined;
}): AuthenticatedRegisterDecision {
  const path =
    input.pathname.length > 1 && input.pathname.endsWith("/")
      ? input.pathname.slice(0, -1)
      : input.pathname;

  if (path !== ROUTES.register) {
    return { action: "to_dashboard" };
  }

  const redirectPath = getSafeRedirect(input.redirectParam);
  const invitedEmail = normalizeEmail(input.invitedEmail);
  if (!redirectPath || !invitedEmail) {
    return { action: "to_dashboard" };
  }

  const sessionEmail = normalizeEmail(input.sessionEmail);
  if (!sessionEmail) {
    return { action: "to_dashboard" };
  }

  if (sessionEmail === invitedEmail) {
    return { action: "to_invitation", path: redirectPath };
  }

  return { action: "wrong_account", invitedEmail, redirectPath };
}

export function buildInvitationRegisterUrl(
  invitedEmail: string,
  redirectPath: string,
): string {
  const params = new URLSearchParams({
    email: invitedEmail,
    redirect: redirectPath,
  });
  return `${ROUTES.register}?${params.toString()}`;
}
