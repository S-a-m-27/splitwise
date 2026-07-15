import { useCurrencyStore } from "@/stores/currency-store";

export const DEFAULT_CURRENCY_CODE = "PKR" as const;

export type CurrencyCode =
  | "PKR"
  | "USD"
  | "EUR"
  | "GBP"
  | "INR"
  | "AED"
  | "SAR"
  | "CAD"
  | "AUD"
  | "JPY"
  | "SGD"
  | "MYR"
  | "BDT"
  | "TRY"
  | "CNY";

export interface CurrencyConfig {
  readonly code: CurrencyCode;
  readonly name: string;
  readonly symbol: string;
  readonly locale: string;
  readonly flag: string;
}

export const SUPPORTED_CURRENCIES: readonly CurrencyConfig[] = [
  { code: "PKR", name: "Pakistani Rupee", symbol: "Rs", locale: "en-PK", flag: "🇵🇰" },
  { code: "USD", name: "US Dollar", symbol: "$", locale: "en-US", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", symbol: "€", locale: "en-IE", flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", symbol: "£", locale: "en-GB", flag: "🇬🇧" },
  { code: "INR", name: "Indian Rupee", symbol: "₹", locale: "en-IN", flag: "🇮🇳" },
  { code: "AED", name: "UAE Dirham", symbol: "AED", locale: "en-AE", flag: "🇦🇪" },
  { code: "SAR", name: "Saudi Riyal", symbol: "SAR", locale: "ar-SA", flag: "🇸🇦" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$", locale: "en-CA", flag: "🇨🇦" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", locale: "en-AU", flag: "🇦🇺" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", locale: "ja-JP", flag: "🇯🇵" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", locale: "en-SG", flag: "🇸🇬" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", locale: "en-MY", flag: "🇲🇾" },
  { code: "BDT", name: "Bangladeshi Taka", symbol: "৳", locale: "en-BD", flag: "🇧🇩" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺", locale: "tr-TR", flag: "🇹🇷" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", locale: "zh-CN", flag: "🇨🇳" },
] as const;

export const POPULAR_CURRENCY_CODES: readonly CurrencyCode[] = [
  "PKR",
  "USD",
  "EUR",
  "GBP",
  "INR",
  "AED",
] as const;

const currencyByCode = new Map<CurrencyCode, CurrencyConfig>(
  SUPPORTED_CURRENCIES.map((currency) => [currency.code, currency]),
);

const formatterCache = new Map<string, Intl.NumberFormat>();

export function isCurrencyCode(value: string): value is CurrencyCode {
  return currencyByCode.has(value as CurrencyCode);
}

export function getCurrencyConfig(code: string = DEFAULT_CURRENCY_CODE): CurrencyConfig {
  if (isCurrencyCode(code)) {
    return currencyByCode.get(code)!;
  }

  return currencyByCode.get(DEFAULT_CURRENCY_CODE)!;
}

function getAmountFormatter(locale: string): Intl.NumberFormat {
  const cached = formatterCache.get(locale);

  if (cached) return cached;

  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  formatterCache.set(locale, formatter);
  return formatter;
}

/** Formats a positive number with the active currency symbol (no sign). */
export function formatMoney(amount: number, code?: CurrencyCode): string {
  const resolvedCode = code ?? useCurrencyStore.getState().currencyCode;
  const { symbol, locale } = getCurrencyConfig(resolvedCode);
  const formatted = getAmountFormatter(locale).format(Math.abs(amount));

  return `${symbol} ${formatted}`;
}

/** Formats a number with +/- prefix for balances. */
export function formatSignedMoney(amount: number, code?: CurrencyCode): string {
  const formatted = formatMoney(amount, code);

  if (amount > 0) return `+${formatted}`;
  if (amount < 0) return `-${formatted}`;
  return formatted;
}

/** @deprecated Use getCurrencyConfig(code). Kept for gradual migration. */
export const CURRENCY = getCurrencyConfig(DEFAULT_CURRENCY_CODE);
