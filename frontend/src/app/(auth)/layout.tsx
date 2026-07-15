"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { AuthGateLoader } from "@/features/auth/components/auth-gate-loader";
import { useAuth } from "@/features/auth";

interface AuthRouteLayoutProps {
  children: ReactNode;
}

/**
 * Redirects authenticated users away from login/register pages.
 */
export default function AuthRouteLayout({ children }: AuthRouteLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(ROUTES.dashboard);
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <AuthGateLoader message="Checking authentication..." />;
  }

  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
