import { AUTH_ROUTES, PROTECTED_ROUTES, type AppRoute } from "@/constants/routes";

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export function isProtectedRoute(pathname: string): boolean {
  const path = normalizePath(pathname);
  return PROTECTED_ROUTES.some(
    (route) => path === route || path.startsWith(`${route}/`),
  );
}

export function isAuthRoute(pathname: string): boolean {
  const path = normalizePath(pathname);
  return AUTH_ROUTES.some(
    (route) => path === route || path.startsWith(`${route}/`),
  );
}

export function matchesRoute(pathname: string, route: AppRoute): boolean {
  const path = normalizePath(pathname);
  return path === route || path.startsWith(`${route}/`);
}
