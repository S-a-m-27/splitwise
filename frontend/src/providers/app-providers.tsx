"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { ToastProvider } from "@/providers/toast-provider";
import { AuthSync } from "@/providers/auth-sync";
import { RealtimeSync } from "@/providers/realtime-sync";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthSync>
          <RealtimeSync>{children}</RealtimeSync>
        </AuthSync>
        <ToastProvider />
      </QueryProvider>
    </ThemeProvider>
  );
}

