import { formatMoney } from "@/lib/currency";

/** Neutral currency display for expense amounts (no +/- balance prefix). */
export function formatExpenseAmount(amount: number): string {
  return formatMoney(amount);
}
