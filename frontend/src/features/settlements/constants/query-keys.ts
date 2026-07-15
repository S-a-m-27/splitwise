export const settlementsKeys = {
  all: ["settlements"] as const,
  lists: () => [...settlementsKeys.all, "list"] as const,
  list: (userId: string | undefined, groupId?: string) =>
    [...settlementsKeys.lists(), userId ?? "anonymous", groupId ?? "all"] as const,
  debts: (userId: string | undefined) =>
    [...settlementsKeys.all, "debts", userId ?? "anonymous"] as const,
};
