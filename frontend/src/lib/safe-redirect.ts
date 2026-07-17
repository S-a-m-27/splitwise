import { AUTH_ROUTES, ROUTES } from "@/constants/routes";

/**
 * Validates a post-login redirect path — prevents open redirects.
 * Rejects protocol-relative URLs, backslash tricks (`/\evil.com`), and auth routes
 * (except explicitly allowed recovery paths).
 */
export function getSafeRedirect(
  path: string | null | undefined,
  options?: { allowPaths?: readonly string[] },
): string | null {
  if (!path) return null;

  let trimmed = path.trim();
  if (!trimmed) return null;

  try {
    trimmed = decodeURIComponent(trimmed);
  } catch {
    return null;
  }

  trimmed = trimmed.trim();
  if (!trimmed.startsWith("/")) return null;

  // Block //… and /\… (Node URL treats /\evil.com as host evil.com)
  if (
    trimmed.startsWith("//") ||
    trimmed.includes("\\") ||
    trimmed.toLowerCase().includes("%2f%2f") ||
    /[\u0000-\u001f\u007f]/.test(trimmed)
  ) {
    return null;
  }

  const [pathnamePart = "", ...queryParts] = trimmed.split("?");
  const pathname = pathnamePart;
  const query = queryParts.length > 0 ? queryParts.join("?") : "";

  if (!pathname.startsWith("/") || pathname.startsWith("//") || pathname.includes("\\")) {
    return null;
  }

  // Landing `/` is not a post-auth destination (Supabase Site URL often equals `/`).
  if (pathname === "/" || pathname === ROUTES.home) {
    return null;
  }

  const allowPaths = options?.allowPaths ?? [];
  const isAllowedException = allowPaths.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!isAllowedException) {
    const isAuthRoute = AUTH_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    );
    if (isAuthRoute) return null;
  }

  if (pathname === ROUTES.authCallback || pathname.startsWith(`${ROUTES.authCallback}/`)) {
    return null;
  }

  return query ? `${pathname}?${query}` : pathname;
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
