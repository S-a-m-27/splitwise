import type { ReactNode } from "react";

interface AuthRouteLayoutProps {
  children: ReactNode;
}

/**
 * Auth route group shell. Redirects for signed-in users are handled in middleware.
 */
export default function AuthRouteLayout({ children }: AuthRouteLayoutProps) {
  return <>{children}</>;
}
