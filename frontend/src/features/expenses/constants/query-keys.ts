export const expensesKeys = {
  all: ["expenses"] as const,
  lists: () => [...expensesKeys.all, "list"] as const,
  list: (userId: string | undefined, groupId?: string) =>
    [...expensesKeys.lists(), userId ?? "anonymous", groupId ?? "all"] as const,
  details: () => [...expensesKeys.all, "detail"] as const,
  detail: (expenseId: string, userId: string | undefined) =>
    [...expensesKeys.details(), expenseId, userId ?? "anonymous"] as const,
};
