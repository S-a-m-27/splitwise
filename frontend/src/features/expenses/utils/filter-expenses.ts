import type { ExpenseListItem } from "@/features/expenses/types";

export function filterExpenses(
  expenses: ExpenseListItem[],
  query: string,
): ExpenseListItem[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return expenses;

  return expenses.filter(
    (expense) =>
      expense.title.toLowerCase().includes(normalized) ||
      expense.paidBy.toLowerCase().includes(normalized) ||
      expense.groupName.toLowerCase().includes(normalized),
  );
}
