import { formatMoney } from "@/lib/currency";

/** Formats a number as Rs — includes +/- for balances. */
export function formatCurrency(amount: number): string {
  const formatted = formatMoney(amount);

  if (amount > 0) return `+${formatted}`;
  if (amount < 0) return `-${formatted}`;
  return formatted;
}
