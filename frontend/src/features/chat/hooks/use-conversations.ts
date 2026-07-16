"use client";

import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { mapConversationToUi } from "@/features/chat/adapters/map-chat-ui";
import { CHAT_INBOX_STALE_TIME_MS } from "@/features/chat/constants/query-config";
import { chatQueryKeys } from "@/features/chat/constants/query-keys";
import type { ConversationListItem } from "@/features/chat/types";
import type { ChatConversationPreview } from "@/features/chat/types/ui";
import { conversationService } from "@/features/chat/services/conversation.service";
import { chatRealtimeService } from "@/features/chat/services/chat-realtime.service";
import { getChatErrorMessage } from "@/features/chat/services/chat.errors";
import { applyInboxEvent } from "@/features/chat/cache/reconcile-chat-cache";
import { useConversationPresence } from "@/features/chat/hooks/use-conversation-presence";

export interface UseConversationsResult {
  conversations: ChatConversationPreview[];
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  refetch: () => void;
  isEmpty: boolean;
}

function sortConversations(
  items: ChatConversationPreview[],
): ChatConversationPreview[] {
  return [...items].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
    if (a.unreadCount === 0 && b.unreadCount > 0) return 1;

    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return bTime - aTime;
  });
}

export function useConversations(): UseConversationsResult {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: chatQueryKeys.conversations(),
    queryFn: () => conversationService.listConversations(),
    enabled: isAuthenticated && !!userId && !authLoading,
    staleTime: CHAT_INBOX_STALE_TIME_MS,
  });
  const presence = useConversationPresence(
    (query.data ?? []).map((conversation) => conversation.id),
    userId,
  );

  useEffect(() => {
    if (!userId || !isAuthenticated) return;
    let needsRecovery = false;
    const subscription = chatRealtimeService.subscribeToInbox(userId, (event) => {
      if (
        event.type === "conversation.updated" ||
        event.type === "membership.updated"
      ) {
        const isUnknownMembership =
          event.type === "membership.updated" &&
          !queryClient
            .getQueryData<ConversationListItem[]>(chatQueryKeys.conversations())
            ?.some((item) => item.id === event.conversationId);
        queryClient.setQueryData<ConversationListItem[]>(
          chatQueryKeys.conversations(),
          (current = []) => applyInboxEvent(current, event),
        );
        if (
          event.type === "membership.updated" &&
          isUnknownMembership &&
          !event.member.leftAt
        ) {
          void queryClient.invalidateQueries({
            queryKey: chatQueryKeys.conversations(),
          });
        }
      } else if (event.type === "connection.changed") {
        if (event.status !== "connected") {
          needsRecovery = true;
        } else if (needsRecovery) {
          needsRecovery = false;
          void queryClient.invalidateQueries({
            queryKey: chatQueryKeys.conversations(),
          });
        }
      }
    });
    return () => {
      void subscription.unsubscribe();
    };
  }, [isAuthenticated, queryClient, userId]);

  const conversations = useMemo(
    () =>
      sortConversations(
        (query.data ?? []).map((item) =>
          mapConversationToUi(item, [], userId, presence.get(item.id) ?? []),
        ),
      ),
    [presence, query.data, userId],
  );

  return {
    conversations,
    isLoading: authLoading || query.isLoading,
    isError: query.isError,
    errorMessage: query.error ? getChatErrorMessage(query.error) : null,
    refetch: () => void query.refetch(),
    isEmpty: !query.isLoading && conversations.length === 0,
  };
}

export function useConversation(conversationId: string) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const query = useQuery({
    queryKey: chatQueryKeys.conversation(conversationId),
    queryFn: async () => {
      const [conversation, members] = await Promise.all([
        conversationService.getConversation(conversationId),
        conversationService.listConversationMembers(conversationId),
      ]);
      return mapConversationToUi(conversation, members, user?.id);
    },
    enabled: isAuthenticated && !!user?.id && !authLoading && !!conversationId,
    staleTime: CHAT_INBOX_STALE_TIME_MS,
  });

  return {
    conversation: query.data,
    isLoading: authLoading || query.isLoading,
    isError: query.isError,
    errorMessage: query.error ? getChatErrorMessage(query.error) : null,
  };
}
