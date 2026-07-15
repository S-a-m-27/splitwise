"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import type { GroupBalanceView } from "@/features/balances/adapters/map-balance-ui";
import { BALANCES_STALE_TIME_MS } from "@/features/balances/constants/query-config";
import { balancesKeys } from "@/features/balances/constants/query-keys";
import {
  getBalancesErrorMessage,
  isBalancesSessionError,
} from "@/features/balances/services/balances.errors";
import { balancesService } from "@/features/balances/services/balances.service";
import type { BalanceSummary } from "@/features/dashboard/types";
import type { GroupBalanceSummary } from "@/features/groups/types";

const EMPTY_BALANCE_SUMMARY: BalanceSummary = {
  total: 0,
  youOwe: 0,
  youAreOwed: 0,
};

const EMPTY_GROUP_BALANCE_SUMMARY: GroupBalanceSummary = {
  total: 0,
  youOwe: 0,
  youAreOwed: 0,
};

function useBalancesAuth() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  return { userId: user?.id, isAuthenticated, authLoading };
}

/** Full balance snapshot — powers dashboard, groups list, and group detail. */
export function useBalanceSnapshot() {
  const { userId, isAuthenticated, authLoading } = useBalancesAuth();

  const query = useQuery({
    queryKey: balancesKeys.snapshot(userId),
    queryFn: () => balancesService.getBalanceSnapshot(userId!),
    enabled: isAuthenticated && !!userId && !authLoading,
    staleTime: BALANCES_STALE_TIME_MS,
  });

  return {
    data: query.data,
    isLoading: authLoading || query.isLoading,
    isError: query.isError,
    error: query.error,
    errorMessage: query.error ? getBalancesErrorMessage(query.error) : null,
    isSessionError: query.error ? isBalancesSessionError(query.error) : false,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}

/** Cross-group balance summary for the dashboard hero. */
export function useDashboardBalances() {
  const snapshot = useBalanceSnapshot();

  return {
    data: snapshot.data?.balanceSummary ?? EMPTY_BALANCE_SUMMARY,
    isLoading: snapshot.isLoading,
    isError: snapshot.isError,
    errorMessage: snapshot.errorMessage,
    refetch: snapshot.refetch,
  };
}

/** Per-group balance data for group detail and member cards. */
export function useGroupBalances(groupId: string) {
  const snapshot = useBalanceSnapshot();

  const groupView = useMemo<GroupBalanceView | undefined>(
    () => snapshot.data?.groups[groupId],
    [snapshot.data, groupId],
  );

  return {
    balance: groupView?.balance ?? 0,
    balanceSummary: groupView?.balanceSummary ?? EMPTY_GROUP_BALANCE_SUMMARY,
    memberBalances: groupView?.memberBalances ?? {},
    isLoading: snapshot.isLoading,
    isError: snapshot.isError,
    errorMessage: snapshot.errorMessage,
    refetch: snapshot.refetch,
  };
}

/** Lookup a single group's net balance for list cards. */
export function useGroupBalance(groupId: string) {
  const { balance, isLoading } = useGroupBalances(groupId);
  return { balance, isLoading };
}
