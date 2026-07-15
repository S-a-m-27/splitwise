"use client";

import { useMemo } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { DASHBOARD_STALE_TIME_MS } from "@/features/dashboard/constants/query-config";
import { dashboardKeys } from "@/features/dashboard/constants/query-keys";
import { dashboardService } from "@/features/dashboard/services/dashboard.service";
import {
  getDashboardErrorMessage,
  isDashboardSessionError,
} from "@/features/dashboard/services/dashboard.errors";
import type { DashboardData } from "@/features/dashboard/types/dashboard-data";
import { mapAuthToDashboardUser } from "@/features/dashboard/utils/map-dashboard-user";
import type { DashboardUser } from "@/features/dashboard/types";

interface UseDashboardOptions {
  enabled?: boolean;
}

function useDashboardAuth() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  return { userId: user?.id, isAuthenticated, authLoading };
}

function useDashboardQuery<TData = DashboardData>(
  select?: (data: DashboardData) => TData,
): UseQueryResult<TData, Error> {
  const { userId, isAuthenticated, authLoading } = useDashboardAuth();

  return useQuery({
    queryKey: dashboardKeys.detail(userId),
    queryFn: () => dashboardService.getDashboard(userId!),
    select,
    enabled: isAuthenticated && !!userId && !authLoading,
    staleTime: DASHBOARD_STALE_TIME_MS,
  });
}

/** Primary dashboard query — fetches all sections in one request. */
export function useDashboard(options: UseDashboardOptions = {}) {
  const { userId, isAuthenticated, authLoading } = useDashboardAuth();
  const enabled =
    (options.enabled ?? true) && isAuthenticated && !!userId && !authLoading;

  const query = useQuery({
    queryKey: dashboardKeys.detail(userId),
    queryFn: () => dashboardService.getDashboard(userId!),
    enabled,
    staleTime: DASHBOARD_STALE_TIME_MS,
  });

  return {
    data: query.data,
    isLoading: authLoading || query.isLoading,
    isError: query.isError,
    error: query.error,
    errorMessage: query.error ? getDashboardErrorMessage(query.error) : null,
    isSessionError: query.error ? isDashboardSessionError(query.error) : false,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}

/** Balance summary — shares the dashboard query cache via select. */
export function useBalanceSummary() {
  const { authLoading } = useDashboardAuth();
  const query = useDashboardQuery((data) => data.balanceSummary);

  return {
    data: query.data,
    isLoading: authLoading || query.isLoading,
    isError: query.isError,
    errorMessage: query.error ? getDashboardErrorMessage(query.error) : null,
    isEmpty: query.isSuccess && query.data?.total === 0,
    refetch: query.refetch,
  };
}

/** Groups preview — shares the dashboard query cache via select. */
export function useGroupsPreview() {
  const { authLoading } = useDashboardAuth();
  const query = useDashboardQuery((data) => data.groups);

  return {
    data: query.data ?? [],
    isLoading: authLoading || query.isLoading,
    isError: query.isError,
    errorMessage: query.error ? getDashboardErrorMessage(query.error) : null,
    isEmpty: query.isSuccess && (query.data?.length ?? 0) === 0,
    refetch: query.refetch,
  };
}

/** Recent activity — shares the dashboard query cache via select. */
export function useRecentActivity() {
  const { authLoading } = useDashboardAuth();
  const query = useDashboardQuery((data) => data.activities);

  return {
    data: query.data ?? [],
    isLoading: authLoading || query.isLoading,
    isError: query.isError,
    errorMessage: query.error ? getDashboardErrorMessage(query.error) : null,
    isEmpty: query.isSuccess && (query.data?.length ?? 0) === 0,
    refetch: query.refetch,
  };
}

/** Dashboard user header data — shares the dashboard query cache via select. */
export function useDashboardProfile() {
  const { authLoading } = useDashboardAuth();
  const query = useDashboardQuery((data) => data.user);

  return {
    data: query.data,
    isLoading: authLoading || query.isLoading,
    isError: query.isError,
    errorMessage: query.error ? getDashboardErrorMessage(query.error) : null,
    refetch: query.refetch,
  };
}

/**
 * Nav/sidebar user from auth store — avoids a dashboard fetch on non-dashboard routes.
 */
export function useDashboardNavUser(): DashboardUser | null {
  const { user, profile, isAuthenticated, isLoading } = useAuth();

  return useMemo(() => {
    if (isLoading || !isAuthenticated) return null;
    return mapAuthToDashboardUser(profile, user);
  }, [isLoading, isAuthenticated, profile, user]);
}
