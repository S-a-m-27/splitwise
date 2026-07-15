import { formatSignedMoney } from "@/lib/currency";

/** Formats a number with the active currency — includes +/- for balances. */
export function formatCurrency(amount: number): string {
  return formatSignedMoney(amount);
}
