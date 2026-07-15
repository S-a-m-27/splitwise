"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { activityKeys } from "@/features/activity/constants/query-keys";
import { balancesKeys } from "@/features/balances/constants/query-keys";
import { dashboardKeys } from "@/features/dashboard/constants/query-keys";
import { groupsKeys } from "@/features/groups/constants/query-keys";
import { SETTLEMENTS_STALE_TIME_MS } from "@/features/settlements/constants/query-config";
import { settlementsKeys } from "@/features/settlements/constants/query-keys";
import {
  getSettlementsErrorMessage,
  isSettlementsSessionError,
} from "@/features/settlements/services/settlements.errors";
import { settlementsService } from "@/features/settlements/services/settlements.service";
import type { CreateSettlementInput } from "@/features/settlements/types";

function invalidateSettlementQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string | undefined,
  groupId?: string,
) {
  void queryClient.invalidateQueries({ queryKey: settlementsKeys.list(userId) });
  void queryClient.invalidateQueries({ queryKey: settlementsKeys.list(userId, groupId) });
  void queryClient.invalidateQueries({ queryKey: settlementsKeys.debts(userId) });
  void queryClient.invalidateQueries({ queryKey: balancesKeys.snapshot(userId) });
  void queryClient.invalidateQueries({ queryKey: activityKeys.feeds() });
  void queryClient.invalidateQueries({ queryKey: dashboardKeys.detail(userId) });
  void queryClient.invalidateQueries({ queryKey: groupsKeys.list(userId) });

  if (groupId) {
    void queryClient.invalidateQueries({
      queryKey: groupsKeys.detail(groupId, userId),
    });
  }
}

export function useSettlements(groupId?: string) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const userId = user?.id;

  const query = useQuery({
    queryKey: settlementsKeys.list(userId, groupId),
    queryFn: () => settlementsService.getSettlements(groupId),
    enabled: isAuthenticated && !!userId && !authLoading,
    staleTime: SETTLEMENTS_STALE_TIME_MS,
  });

  return {
    data: query.data ?? [],
    isLoading: authLoading || query.isLoading,
    isError: query.isError,
    errorMessage: query.error ? getSettlementsErrorMessage(query.error) : null,
    isSessionError: query.error ? isSettlementsSessionError(query.error) : false,
    refetch: query.refetch,
    isEmpty: query.isSuccess && (query.data?.length ?? 0) === 0,
  };
}

export function useOutstandingDebts() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const userId = user?.id;

  const query = useQuery({
    queryKey: settlementsKeys.debts(userId),
    queryFn: () => settlementsService.getOutstandingDebts(userId!),
    enabled: isAuthenticated && !!userId && !authLoading,
    staleTime: SETTLEMENTS_STALE_TIME_MS,
  });

  return {
    data: query.data ?? [],
    isLoading: authLoading || query.isLoading,
    isError: query.isError,
    errorMessage: query.error ? getSettlementsErrorMessage(query.error) : null,
    refetch: query.refetch,
    isEmpty: query.isSuccess && (query.data?.length ?? 0) === 0,
  };
}

export function useCreateSettlement() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation({
    mutationFn: (input: CreateSettlementInput) => settlementsService.createSettlement(input),
    onSuccess: (_data, variables) =>
      invalidateSettlementQueries(queryClient, userId, variables.groupId),
  });
}
