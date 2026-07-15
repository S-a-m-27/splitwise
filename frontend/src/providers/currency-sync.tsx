"use client";

import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useCurrencyStore } from "@/stores/currency-store";

interface CurrencySyncProps {
  children: ReactNode;
}

/** Keeps the currency store aligned with the authenticated profile. */
export function CurrencySync({ children }: CurrencySyncProps) {
  const preferredCurrency = useAuthStore((state) => state.profile?.preferredCurrency);
  const hydrateCurrency = useCurrencyStore((state) => state.hydrateCurrency);
  const resetCurrency = useCurrencyStore((state) => state.resetCurrency);
  const isAuthenticated = useAuthStore((state) => !!state.session);

  useEffect(() => {
    if (!isAuthenticated) {
      resetCurrency();
      return;
    }

    hydrateCurrency(preferredCurrency);
  }, [hydrateCurrency, isAuthenticated, preferredCurrency, resetCurrency]);

  return <>{children}</>;
}
