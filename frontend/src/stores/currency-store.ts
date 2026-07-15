"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_CURRENCY_CODE,
  getCurrencyConfig,
  isCurrencyCode,
  type CurrencyCode,
  type CurrencyConfig,
} from "@/lib/currency";

interface CurrencyStore {
  currencyCode: CurrencyCode;
  setCurrencyCode: (code: CurrencyCode) => void;
  hydrateCurrency: (code: string | null | undefined) => void;
  resetCurrency: () => void;
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set) => ({
      currencyCode: DEFAULT_CURRENCY_CODE,
      setCurrencyCode: (code) => set({ currencyCode: code }),
      hydrateCurrency: (code) => {
        if (code && isCurrencyCode(code)) {
          set({ currencyCode: code });
        }
      },
      resetCurrency: () => set({ currencyCode: DEFAULT_CURRENCY_CODE }),
    }),
    {
      name: "splitwise-currency",
      partialize: (state) => ({ currencyCode: state.currencyCode }),
    },
  ),
);

export function getActiveCurrency(): CurrencyConfig {
  return getCurrencyConfig(useCurrencyStore.getState().currencyCode);
}
