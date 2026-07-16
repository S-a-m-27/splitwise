import type { QueryClient } from "@tanstack/react-query";
import { activityKeys } from "@/features/activity/constants/query-keys";
import { balancesKeys } from "@/features/balances/constants/query-keys";
import { dashboardKeys } from "@/features/dashboard/constants/query-keys";
import { expensesKeys } from "@/features/expenses/constants/query-keys";
import { groupsKeys } from "@/features/groups/constants/query-keys";
import { settlementsKeys } from "@/features/settlements/constants/query-keys";
import { invitationsKeys } from "@/features/invitations/constants/query-keys";

export type RealtimeTable =
  | "expenses"
  | "expense_participants"
  | "settlements"
  | "group_members"
  | "group_guests"
  | "groups"
  | "group_invitations"
  | "notifications"
  | "group_activities";

export interface RealtimeChangeContext {
  table: RealtimeTable;
  groupId?: string;
  expenseId?: string;
}

/** Refetch TanStack Query caches after a peer changes shared data. */
export function invalidateQueriesForRealtimeChange(
  queryClient: QueryClient,
  userId: string,
  { table, groupId, expenseId }: RealtimeChangeContext,
) {
  const affectsBalances =
    table === "expenses" ||
    table === "expense_participants" ||
    table === "settlements" ||
    table === "group_members" ||
    table === "group_guests";

  const affectsExpenses =
    table === "expenses" || table === "expense_participants";

  const affectsSettlements = table === "settlements";

  const affectsGroups =
    table === "groups" ||
    table === "group_members" ||
    table === "group_guests";

  if (affectsGroups) {
    void queryClient.invalidateQueries({ queryKey: groupsKeys.list(userId) });
  }

  if (table === "expense_participants" && !groupId) {
    void queryClient.invalidateQueries({ queryKey: groupsKeys.details() });
  }

  if (affectsExpenses) {
    void queryClient.invalidateQueries({ queryKey: expensesKeys.list(userId) });
    if (groupId) {
      void queryClient.invalidateQueries({
        queryKey: expensesKeys.list(userId, groupId),
      });
    }
  }

  if (expenseId) {
    void queryClient.invalidateQueries({
      queryKey: expensesKeys.detail(expenseId, userId),
    });
  }

  if (affectsSettlements) {
    void queryClient.invalidateQueries({ queryKey: settlementsKeys.list(userId) });
    void queryClient.invalidateQueries({ queryKey: settlementsKeys.debts(userId) });
    if (groupId) {
      void queryClient.invalidateQueries({
        queryKey: settlementsKeys.list(userId, groupId),
      });
    }
  }

  if (affectsBalances) {
    void queryClient.invalidateQueries({
      queryKey: balancesKeys.snapshot(userId),
    });
  }

  if (
    affectsExpenses ||
    affectsSettlements ||
    affectsGroups
  ) {
    void queryClient.invalidateQueries({ queryKey: activityKeys.feeds() });
    void queryClient.invalidateQueries({ queryKey: dashboardKeys.detail(userId) });
  }

  if (groupId) {
    void queryClient.invalidateQueries({
      queryKey: groupsKeys.detail(groupId, userId),
    });
    void queryClient.invalidateQueries({
      queryKey: groupsKeys.invite(groupId, userId),
    });
    void queryClient.invalidateQueries({
      queryKey: invitationsKeys.group(groupId, userId),
    });
  }

  if (table === "group_invitations") {
    void queryClient.invalidateQueries({ queryKey: invitationsKeys.pending(userId) });
    void queryClient.invalidateQueries({ queryKey: invitationsKeys.history(userId) });
    void queryClient.invalidateQueries({ queryKey: invitationsKeys.all });
  }

  if (table === "notifications") {
    void queryClient.invalidateQueries({ queryKey: invitationsKeys.badge(userId) });
    void queryClient.invalidateQueries({ queryKey: invitationsKeys.notifications(userId) });
    void queryClient.invalidateQueries({ queryKey: invitationsKeys.history(userId) });
  }

  if (table === "group_activities" && groupId) {
    void queryClient.invalidateQueries({ queryKey: activityKeys.feeds() });
    void queryClient.invalidateQueries({
      queryKey: groupsKeys.detail(groupId, userId),
    });
  }
}
