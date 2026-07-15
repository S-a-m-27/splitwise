export const balancesKeys = {
  all: ["balances"] as const,
  snapshots: () => [...balancesKeys.all, "snapshot"] as const,
  snapshot: (userId: string | undefined) =>
    [...balancesKeys.snapshots(), userId ?? "anonymous"] as const,
};
