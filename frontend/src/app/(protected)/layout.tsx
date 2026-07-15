"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthGateLoader } from "@/features/auth/components/auth-gate-loader";
import { useAuth } from "@/features/auth";
import { buildLoginRedirectUrl } from "@/lib/safe-redirect";

interface ProtectedLayoutProps {
  children: ReactNode;
}

/**
 * Client-side guard for protected routes.
 * Server-side enforcement is handled in middleware.
 */
export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(buildLoginRedirectUrl(pathname));
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return <AuthGateLoader message="Verifying access session..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <div className="min-h-dvh overflow-x-hidden bg-background text-foreground">{children}</div>;
}
