import type { OutstandingDebt } from "@/features/settlements/types";

export function filterOutstandingDebtsByGroup(
  debts: readonly OutstandingDebt[],
  groupId: string,
): OutstandingDebt[] {
  return debts.filter((debt) => debt.groupId === groupId);
}
