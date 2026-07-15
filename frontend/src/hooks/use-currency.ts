"use client";

import { useMemo } from "react";
import { useCurrencyStore } from "@/stores/currency-store";
import {
  formatMoney,
  formatSignedMoney,
  getCurrencyConfig,
  type CurrencyCode,
  type CurrencyConfig,
} from "@/lib/currency";

/** Reactive currency helpers for client components. */
export function useCurrency() {
  const currencyCode = useCurrencyStore((state) => state.currencyCode);
  const currency = useMemo(() => getCurrencyConfig(currencyCode), [currencyCode]);

  return useMemo(
    () => ({
      currencyCode,
      currency,
      symbol: currency.symbol,
      formatMoney: (amount: number) => formatMoney(amount, currencyCode),
      formatCurrency: (amount: number) => formatSignedMoney(amount, currencyCode),
    }),
    [currency, currencyCode],
  );
}

export type { CurrencyCode, CurrencyConfig };
