/** App-wide currency — Pakistani Rupees. */
export const CURRENCY = {
  code: "PKR",
  symbol: "Rs",
  locale: "en-PK",
} as const;

const amountFormatter = new Intl.NumberFormat(CURRENCY.locale, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Formats a positive number with the Rs prefix (no sign). */
export function formatMoney(amount: number): string {
  return `${CURRENCY.symbol} ${amountFormatter.format(Math.abs(amount))}`;
}
