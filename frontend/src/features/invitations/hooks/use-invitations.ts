"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { mapSearchCandidateRow } from "@/features/invitations/adapters/map-invitation-ui";
import {
  mapMemberInvitationToPendingItem,
  mapMemberInvitationToReceivedItem,
} from "@/features/invitations/adapters/map-invitation-ui";
import { INVITATIONS_STALE_TIME_MS } from "@/features/invitations/constants/query-config";
import { invitationsKeys } from "@/features/invitations/constants/query-keys";
import { invitationRealtimeService } from "@/features/invitations/services/realtime.service";
import { getInvitationErrorMessage } from "@/features/invitations/services/invitation.service";
import { invitationService } from "@/features/invitations/services/invitation.service";
import { notificationService } from "@/features/invitations/services/notification.service";
import type { CreateMemberInvitationInput } from "@/features/invitations/types";
import type { InviteSearchResult, PendingInvitationItem, ReceivedInvitationItem } from "@/features/invitations/types/ui";
import { isValidEmailQuery } from "@/features/invitations/utils/is-valid-email-query";

const SEARCH_DEBOUNCE_MS = 350;

export type InvitationSearchStatus = "idle" | "loading" | "success" | "error";

function useInvitationsAuth() {
  const { user, isAuthenticated, isLoading } = useAuth();
  return { userId: user?.id, isAuthenticated, authLoading: isLoading };
}

export function useInvitationSearch(groupId: string) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [emailRegistered, setEmailRegistered] = useState<boolean | null>(null);
  const { userId, isAuthenticated, authLoading } = useInvitationsAuth();

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  const searchQuery = useQuery({
    queryKey: invitationsKeys.search(groupId, debouncedQuery),
    queryFn: async () => {
      const rows = await invitationService.searchCandidates(groupId, debouncedQuery);
      return rows.map((row) =>
        mapSearchCandidateRow(
          row as {
            id: string;
            display_name: string;
            email: string;
            avatar_url: string | null;
            is_registered: boolean;
            state: InviteSearchResult["state"];
          },
        ),
      );
    },
    enabled:
      isAuthenticated &&
      !!userId &&
      !authLoading &&
      debouncedQuery.trim().length >= 2,
    staleTime: INVITATIONS_STALE_TIME_MS,
  });

  useEffect(() => {
    if (!isValidEmailQuery(debouncedQuery)) {
      setEmailRegistered(null);
      return;
    }

    let cancelled = false;
    invitationService
      .isEmailRegistered(debouncedQuery)
      .then((registered) => {
        if (!cancelled) setEmailRegistered(registered);
      })
      .catch(() => {
        if (!cancelled) setEmailRegistered(null);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const isEmailQuery = isValidEmailQuery(query);
  const showUnregisteredCard =
    isEmailQuery &&
    searchQuery.isSuccess &&
    (searchQuery.data?.length ?? 0) === 0 &&
    emailRegistered === false &&
    debouncedQuery.trim().length > 0;

  const status: InvitationSearchStatus = !debouncedQuery.trim()
    ? "idle"
    : searchQuery.isLoading ||
        (isValidEmailQuery(debouncedQuery) && emailRegistered === null)
      ? "loading"
      : searchQuery.isError
        ? "error"
        : "success";

  return {
    query,
    setQuery,
    results: searchQuery.data ?? [],
    recentSearches: [] as readonly string[],
    status,
    isEmailQuery,
    showUnregisteredCard,
    errorMessage: searchQuery.error ? getInvitationErrorMessage(searchQuery.error) : null,
    clearSearch: () => setQuery(""),
  };
}

export function usePendingInvitations(
  groupId: string,
  context: { groupName: string; groupIcon: string },
) {
  const { userId, isAuthenticated, authLoading } = useInvitationsAuth();

  const query = useQuery({
    queryKey: invitationsKeys.group(groupId, userId ?? ""),
    queryFn: async () => {
      const rows = await invitationService.getGroupInvitations({ groupId });
      return rows.map((invitation) =>
        mapMemberInvitationToPendingItem(invitation, {
          groupName: context.groupName,
          groupIcon: context.groupIcon,
          displayName: null,
        }),
      );
    },
    enabled: isAuthenticated && !!userId && !authLoading && !!groupId,
    staleTime: INVITATIONS_STALE_TIME_MS,
  });

  return {
    invitations: (query.data ?? []) as PendingInvitationItem[],
    isLoading: query.isLoading,
    isError: query.isError,
    errorMessage: query.error ? getInvitationErrorMessage(query.error) : null,
  };
}

export function useInvitationBadge() {
  const { userId, isAuthenticated, authLoading } = useInvitationsAuth();

  const query = useQuery({
    queryKey: invitationsKeys.badge(userId ?? ""),
    queryFn: () => notificationService.getUnreadCount(),
    enabled: isAuthenticated && !!userId && !authLoading,
    staleTime: INVITATIONS_STALE_TIME_MS,
  });

  const count = query.data ?? 0;
  return {
    count,
    hasUnread: count > 0,
    isLoading: query.isLoading,
  };
}

export function useInvitationNotifications() {
  const queryClient = useQueryClient();
  const { userId, isAuthenticated, authLoading } = useInvitationsAuth();
  const queryKey = invitationsKeys.notifications(userId ?? "");
  const query = useQuery({
    queryKey,
    queryFn: () => notificationService.getInvitationNotifications(),
    enabled: isAuthenticated && !!userId && !authLoading,
    staleTime: INVITATIONS_STALE_TIME_MS,
  });
  const markReadMutation = useMutation({
    mutationFn: (notificationIds: string[]) =>
      notificationService.markManyAsRead(notificationIds),
    onSuccess: (_data, notificationIds) => {
      const readAt = new Date().toISOString();
      queryClient.setQueryData<Awaited<ReturnType<typeof notificationService.getInvitationNotifications>>>(
        queryKey,
        (current) =>
          current?.map((notification) =>
            notificationIds.includes(notification.id)
              ? { ...notification, read_at: readAt }
              : notification,
          ),
      );
      if (userId) queryClient.setQueryData(invitationsKeys.badge(userId), 0);
    },
  });

  return {
    notifications: query.data ?? [],
    isLoading: query.isLoading,
    markAsRead: markReadMutation.mutate,
  };
}

async function enrichReceivedInvitations(): Promise<ReceivedInvitationItem[]> {
  const invitations = await invitationService.getReceivedInvitations();
  if (invitations.length === 0) return [];

  const supabase = (await import("@/lib/supabase/client")).createClient();
  const groupIds = [...new Set(invitations.map((item) => item.groupId))];
  const inviterIds = [...new Set(invitations.map((item) => item.invitedByUserId))];

  const [groupsResult, profilesResult] = await Promise.all([
    supabase.from("groups").select("id, name, icon").in("id", groupIds),
    supabase.from("profiles").select("id, full_name").in("id", inviterIds),
  ]);

  const groupMap = new Map(
    (groupsResult.data ?? []).map((g) => [g.id, { name: g.name, icon: g.icon }]),
  );
  const profileMap = new Map(
    (profilesResult.data ?? []).map((p) => [p.id, p.full_name as string]),
  );

  return invitations.map((invitation) =>
    mapMemberInvitationToReceivedItem(invitation, {
      groupName: groupMap.get(invitation.groupId)?.name ?? "Unknown group",
      groupIcon: groupMap.get(invitation.groupId)?.icon ?? "👥",
      invitedByName: profileMap.get(invitation.invitedByUserId) ?? "Someone",
    }),
  );
}

export function useInvitationDetail(invitationId: string) {
  const { userId, isAuthenticated, authLoading } = useInvitationsAuth();

  const query = useQuery({
    queryKey: invitationsKeys.detail(invitationId, userId ?? ""),
    queryFn: async () => {
      const invitation = await invitationService.findInvitation(invitationId);
      if (!invitation) return null;

      const supabase = (await import("@/lib/supabase/client")).createClient();
      const [groupResult, profileResult] = await Promise.all([
        supabase.from("groups").select("name, icon").eq("id", invitation.groupId).maybeSingle(),
        supabase
          .from("profiles")
          .select("full_name")
          .eq("id", invitation.invitedByUserId)
          .maybeSingle(),
      ]);

      return mapMemberInvitationToReceivedItem(invitation, {
        groupName: groupResult.data?.name ?? "Unknown group",
        groupIcon: groupResult.data?.icon ?? "👥",
        invitedByName: (profileResult.data?.full_name as string | undefined) ?? "Someone",
      });
    },
    enabled: isAuthenticated && !!userId && !authLoading && !!invitationId,
    staleTime: INVITATIONS_STALE_TIME_MS,
  });

  return {
    invitation: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    errorMessage: query.error ? getInvitationErrorMessage(query.error) : null,
  };
}

export function useInvitationHistory() {
  const { userId, isAuthenticated, authLoading } = useInvitationsAuth();

  const query = useQuery({
    queryKey: invitationsKeys.history(userId ?? ""),
    queryFn: enrichReceivedInvitations,
    enabled: isAuthenticated && !!userId && !authLoading,
    staleTime: INVITATIONS_STALE_TIME_MS,
  });

  const all = query.data ?? [];
  const pending = all.filter((item) => item.status === "pending");
  const accepted = all.filter((item) => item.status === "accepted");
  const declined = all.filter((item) =>
    item.status === "declined" ||
    item.status === "cancelled" ||
    item.status === "expired",
  );

  return {
    pending,
    accepted,
    declined,
    isLoading: query.isLoading,
    isError: query.isError,
    errorMessage: query.error ? getInvitationErrorMessage(query.error) : null,
  };
}

export function useCreateInvitation(groupId: string) {
  const queryClient = useQueryClient();
  const { userId } = useInvitationsAuth();

  return useMutation({
    mutationFn: (input: CreateMemberInvitationInput) =>
      invitationService.createInvitation(input),
    onSuccess: () => {
      if (userId) {
        invitationRealtimeService.invalidateForUser(queryClient, userId, { groupId });
      }
    },
  });
}

export function useAcceptInvitation(options?: { acceptedVia?: "email" | "application" }) {
  const queryClient = useQueryClient();
  const { userId } = useInvitationsAuth();

  return useMutation({
    mutationFn: (invitationId: string) =>
      invitationService.acceptInvitation({
        invitationId,
        acceptedVia: options?.acceptedVia ?? "application",
      }),
    onSuccess: async (invitation) => {
      if (userId) {
        await invitationRealtimeService.invalidateForUser(queryClient, userId, {
          groupId: invitation.groupId,
          invitationId: invitation.id,
        });
      }
    },
  });
}

export function useDeclineInvitation() {
  const queryClient = useQueryClient();
  const { userId } = useInvitationsAuth();

  return useMutation({
    mutationFn: (invitationId: string) => invitationService.declineInvitation(invitationId),
    onSuccess: (invitation) => {
      if (userId) {
        invitationRealtimeService.invalidateForUser(queryClient, userId, {
          groupId: invitation.groupId,
          invitationId: invitation.id,
        });
      }
    },
  });
}

export function useCancelInvitation(groupId: string) {
  const queryClient = useQueryClient();
  const { userId } = useInvitationsAuth();

  return useMutation({
    mutationFn: (invitationId: string) => invitationService.cancelInvitation(invitationId),
    onSuccess: (invitation) => {
      if (userId) {
        invitationRealtimeService.invalidateForUser(queryClient, userId, {
          groupId,
          invitationId: invitation.id,
        });
      }
    },
  });
}
