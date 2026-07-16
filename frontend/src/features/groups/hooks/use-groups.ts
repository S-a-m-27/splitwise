"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { balancesKeys } from "@/features/balances/constants/query-keys";
import { balancesService } from "@/features/balances/services/balances.service";
import {
  getBalancesErrorMessage,
  isBalancesSessionError,
} from "@/features/balances/services/balances.errors";
import { dashboardKeys } from "@/features/dashboard/constants/query-keys";
import { GROUPS_STALE_TIME_MS } from "@/features/groups/constants/query-config";
import { groupsKeys } from "@/features/groups/constants/query-keys";
import {
  getGroupsErrorMessage,
  isGroupsSessionError,
  normalizeGroupsError,
} from "@/features/groups/services/groups.errors";
import { groupsService } from "@/features/groups/services/groups.service";
import type {
  CreateGroupFormValues,
  EditGroupFormValues,
} from "@/features/groups/types";

function useGroupsAuth() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  return { userId: user?.id, isAuthenticated, authLoading };
}

function invalidateGroupsQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string | undefined,
  groupId?: string,
) {
  void queryClient.invalidateQueries({ queryKey: groupsKeys.list(userId) });
  void queryClient.invalidateQueries({ queryKey: dashboardKeys.detail(userId) });
  void queryClient.invalidateQueries({ queryKey: balancesKeys.snapshot(userId) });

  if (groupId) {
    void queryClient.invalidateQueries({
      queryKey: groupsKeys.detail(groupId, userId),
    });
    void queryClient.invalidateQueries({
      queryKey: groupsKeys.invite(groupId, userId),
    });
  }
}

/** All groups for the authenticated user. */
export function useGroups() {
  const { userId, isAuthenticated, authLoading } = useGroupsAuth();

  const groupsQuery = useQuery({
    queryKey: groupsKeys.list(userId),
    queryFn: () => groupsService.getGroups(),
    enabled: isAuthenticated && !!userId && !authLoading,
    staleTime: GROUPS_STALE_TIME_MS,
  });

  const balancesQuery = useQuery({
    queryKey: balancesKeys.snapshot(userId),
    queryFn: () => balancesService.getBalanceSnapshot(userId!),
    enabled: isAuthenticated && !!userId && !authLoading,
    staleTime: GROUPS_STALE_TIME_MS,
  });

  const data = useMemo(() => {
    const groups = groupsQuery.data ?? [];
    const snapshot = balancesQuery.data;

    if (!snapshot) return groups;

    return groups.map((group) => ({
      ...group,
      balance: snapshot.groups[group.id]?.balance ?? 0,
    }));
  }, [groupsQuery.data, balancesQuery.data]);

  const isLoading =
    authLoading || groupsQuery.isLoading || balancesQuery.isLoading;

  return {
    data,
    isLoading,
    isError: groupsQuery.isError || balancesQuery.isError,
    error: groupsQuery.error ?? balancesQuery.error,
    errorMessage: groupsQuery.error
      ? getGroupsErrorMessage(groupsQuery.error)
      : balancesQuery.error
        ? getBalancesErrorMessage(balancesQuery.error)
        : null,
    isSessionError:
      (groupsQuery.error ? isGroupsSessionError(groupsQuery.error) : false) ||
      (balancesQuery.error ? isBalancesSessionError(balancesQuery.error) : false),
    refetch: async () => {
      await Promise.all([groupsQuery.refetch(), balancesQuery.refetch()]);
    },
    isEmpty: groupsQuery.isSuccess && (groupsQuery.data?.length ?? 0) === 0,
  };
}

/** Single group detail. */
export function useGroup(groupId: string) {
  const { userId, isAuthenticated, authLoading } = useGroupsAuth();

  const query = useQuery({
    queryKey: groupsKeys.detail(groupId, userId),
    queryFn: () => groupsService.getGroup(groupId),
    enabled: isAuthenticated && !!userId && !!groupId && !authLoading,
    staleTime: GROUPS_STALE_TIME_MS,
    retry: (failureCount, error) => {
      if (failureCount >= 2) return false;
      return normalizeGroupsError(error).code === "NOT_FOUND";
    },
    retryDelay: 400,
  });

  return {
    data: query.data,
    isLoading: authLoading || query.isLoading,
    isError: query.isError,
    error: query.error,
    errorMessage: query.error ? getGroupsErrorMessage(query.error) : null,
    isSessionError: query.error ? isGroupsSessionError(query.error) : false,
    refetch: query.refetch,
  };
}

/** Active invite link for a group. */
export function useInvite(groupId: string) {
  const { userId, isAuthenticated, authLoading } = useGroupsAuth();

  const query = useQuery({
    queryKey: groupsKeys.invite(groupId, userId),
    queryFn: () => groupsService.getInvite(groupId),
    enabled: isAuthenticated && !!userId && !!groupId && !authLoading,
    staleTime: GROUPS_STALE_TIME_MS,
  });

  return {
    data: query.data,
    isLoading: authLoading || query.isLoading,
    isError: query.isError,
    errorMessage: query.error ? getGroupsErrorMessage(query.error) : null,
    refetch: query.refetch,
  };
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  const { userId } = useGroupsAuth();

  return useMutation({
    mutationFn: (values: CreateGroupFormValues) => groupsService.createGroup(values),
    onSuccess: () => invalidateGroupsQueries(queryClient, userId),
  });
}

export function useUpdateGroup(groupId: string) {
  const queryClient = useQueryClient();
  const { userId } = useGroupsAuth();

  return useMutation({
    mutationFn: (values: EditGroupFormValues) =>
      groupsService.updateGroup(groupId, values),
    onSuccess: () => invalidateGroupsQueries(queryClient, userId, groupId),
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  const { userId } = useGroupsAuth();

  return useMutation({
    mutationFn: (groupId: string) => groupsService.deleteGroup(groupId),
    onSuccess: (_data, groupId) => invalidateGroupsQueries(queryClient, userId, groupId),
  });
}

export function useLeaveGroup() {
  const queryClient = useQueryClient();
  const { userId } = useGroupsAuth();

  return useMutation({
    mutationFn: (groupId: string) => groupsService.leaveGroup(groupId),
    onSuccess: (_data, groupId) => invalidateGroupsQueries(queryClient, userId, groupId),
  });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();
  const { userId } = useGroupsAuth();

  return useMutation({
    mutationFn: (inviteCode: string) => groupsService.joinGroup(inviteCode),
    onSuccess: () => invalidateGroupsQueries(queryClient, userId),
  });
}

export function useGenerateInvite(groupId: string) {
  const queryClient = useQueryClient();
  const { userId } = useGroupsAuth();

  return useMutation({
    mutationFn: () => groupsService.generateInvite(groupId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: groupsKeys.invite(groupId, userId),
      });
      void queryClient.invalidateQueries({
        queryKey: groupsKeys.detail(groupId, userId),
      });
    },
  });
}

export function useAddMemberByEmail(groupId: string) {
  const queryClient = useQueryClient();
  const { userId } = useGroupsAuth();

  return useMutation({
    mutationFn: (email: string) => groupsService.addMemberByEmail(groupId, email),
    onSuccess: () => invalidateGroupsQueries(queryClient, userId, groupId),
  });
}

export function useAddGuestByName(groupId: string) {
  const queryClient = useQueryClient();
  const { userId } = useGroupsAuth();

  return useMutation({
    mutationFn: (name: string) => groupsService.addGuestByName(groupId, name),
    onSuccess: () => invalidateGroupsQueries(queryClient, userId, groupId),
  });
}
