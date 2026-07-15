import { AUTH_ROUTES, ROUTES } from "@/constants/routes";

/**
 * Validates a post-login redirect path — prevents open redirects.
 */
export function getSafeRedirect(path: string | null | undefined): string | null {
  if (!path) return null;

  const trimmed = path.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;

  const normalized = trimmed.split("?")[0] ?? trimmed;

  const isAuthRoute = AUTH_ROUTES.some(
    (route) => normalized === route || normalized.startsWith(`${route}/`),
  );
  if (isAuthRoute) return null;

  return trimmed;
}

export function buildLoginRedirectUrl(returnPath: string): string {
  const safe = getSafeRedirect(returnPath);
  if (!safe) return ROUTES.login;
  return `${ROUTES.login}?redirect=${encodeURIComponent(safe)}`;
}

export function buildInviteUrl(inviteCode: string, appUrl: string): string {
  const base = appUrl.replace(/\/$/, "");
  return `${base}/invite/${inviteCode}`;
}
