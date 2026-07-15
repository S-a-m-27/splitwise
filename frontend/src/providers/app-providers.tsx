"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { ToastProvider } from "@/providers/toast-provider";
import { AuthSync } from "@/providers/auth-sync";
import { CurrencySync } from "@/providers/currency-sync";
import { RealtimeSync } from "@/providers/realtime-sync";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthSync>
          <CurrencySync>
            <RealtimeSync>{children}</RealtimeSync>
          </CurrencySync>
        </AuthSync>
        <ToastProvider />
      </QueryProvider>
    </ThemeProvider>
  );
}

