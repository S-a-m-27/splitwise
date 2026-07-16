import type { QueryClient } from "@tanstack/react-query";
import { activityKeys } from "@/features/activity/constants/query-keys";
import { balancesKeys } from "@/features/balances/constants/query-keys";
import { dashboardKeys } from "@/features/dashboard/constants/query-keys";
import { settlementsKeys } from "@/features/settlements/constants/query-keys";
import type { SettlementListItem } from "@/features/settlements/types";

interface SettlementInvalidationOptions {
  groupId?: string;
  includeHistory?: boolean;
}

function newestFirst(items: readonly SettlementListItem[]): SettlementListItem[] {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function reconcileSettlementHistory(
  current: readonly SettlementListItem[],
  settlement: SettlementListItem,
): SettlementListItem[] {
  const withoutDuplicate = current.filter(
    (item) =>
      item.id !== settlement.id &&
      (!settlement.clientSettlementId ||
        item.clientSettlementId !== settlement.clientSettlementId),
  );
  return newestFirst([settlement, ...withoutDuplicate]);
}

function updateHistoryIfCached(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  settlement: SettlementListItem,
) {
  queryClient.setQueryData<SettlementListItem[] | undefined>(
    queryKey,
    (current) =>
      current ? reconcileSettlementHistory(current, settlement) : undefined,
  );
}

export function syncCreatedSettlement(
  queryClient: QueryClient,
  userId: string | undefined,
  settlement: SettlementListItem,
) {
  updateHistoryIfCached(
    queryClient,
    settlementsKeys.list(userId),
    settlement,
  );
  updateHistoryIfCached(
    queryClient,
    settlementsKeys.list(userId, settlement.groupId),
    settlement,
  );

  invalidateSettlementDerivedQueries(queryClient, userId, {
    groupId: settlement.groupId,
    includeHistory: false,
  });
}

export function invalidateSettlementDebts(
  queryClient: QueryClient,
  userId: string | undefined,
) {
  void queryClient.invalidateQueries({
    queryKey: settlementsKeys.debts(userId),
  });
}

export function invalidateSettlementDerivedQueries(
  queryClient: QueryClient,
  userId: string | undefined,
  { groupId, includeHistory = true }: SettlementInvalidationOptions = {},
) {
  if (includeHistory) {
    void queryClient.invalidateQueries({
      queryKey: settlementsKeys.list(userId),
    });
    if (groupId) {
      void queryClient.invalidateQueries({
        queryKey: settlementsKeys.list(userId, groupId),
      });
    }
  }

  invalidateSettlementDebts(queryClient, userId);
  void queryClient.invalidateQueries({
    queryKey: balancesKeys.snapshot(userId),
  });
  void queryClient.invalidateQueries({ queryKey: activityKeys.feeds() });
  void queryClient.invalidateQueries({
    queryKey: dashboardKeys.detail(userId),
  });
}

export function recoverSettlementQueries(
  queryClient: QueryClient,
  userId: string,
) {
  void queryClient.invalidateQueries({ queryKey: settlementsKeys.lists() });
  invalidateSettlementDerivedQueries(queryClient, userId, {
    includeHistory: false,
  });
}
