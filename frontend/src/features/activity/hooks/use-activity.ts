"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ACTIVITY_STALE_TIME_MS } from "@/features/activity/constants/query-config";
import { activityKeys } from "@/features/activity/constants/query-keys";
import {
  activityService,
  type ActivityFilter,
} from "@/features/activity/services/activity.service";

interface UseActivityFeedOptions {
  groupId?: string;
  limit?: number;
  filter?: ActivityFilter;
  enabled?: boolean;
}

export function useActivityFeed(options: UseActivityFeedOptions = {}) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const userId = user?.id;
  const enabled = (options.enabled ?? true) && isAuthenticated && !!userId && !authLoading;

  const query = useQuery({
    queryKey: [...activityKeys.feed(userId, options.groupId), options.filter ?? "all"],
    queryFn: () =>
      activityService.getActivityFeed({
        groupId: options.groupId,
        limit: options.limit,
        filter: options.filter,
      }),
    enabled,
    staleTime: ACTIVITY_STALE_TIME_MS,
  });

  return {
    data: query.data ?? [],
    isLoading: authLoading || query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isEmpty: query.isSuccess && (query.data?.length ?? 0) === 0,
  };
}
