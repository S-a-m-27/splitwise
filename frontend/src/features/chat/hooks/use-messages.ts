"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { mapMessageToUi } from "@/features/chat/adapters/map-chat-ui";
import { CHAT_MESSAGES_STALE_TIME_MS } from "@/features/chat/constants/query-config";
import { chatQueryKeys } from "@/features/chat/constants/query-keys";
import { conversationService } from "@/features/chat/services/conversation.service";
import { getChatErrorMessage } from "@/features/chat/services/chat.errors";
import { messageService } from "@/features/chat/services/message.service";

export function useMessages(conversationId: string) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const enabled = isAuthenticated && !!user?.id && !authLoading && !!conversationId;
  const membersQuery = useQuery({
    queryKey: chatQueryKeys.members(conversationId),
    queryFn: () => conversationService.listConversationMembers(conversationId),
    enabled,
    staleTime: CHAT_MESSAGES_STALE_TIME_MS,
  });
  const messagesQuery = useInfiniteQuery({
    queryKey: chatQueryKeys.messages(conversationId),
    queryFn: ({ pageParam }) =>
      messageService.listMessagePage({
        conversationId,
        limit: 50,
        before: pageParam ?? undefined,
      }),
    initialPageParam: null as { createdAt: string; id: string } | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled,
    staleTime: CHAT_MESSAGES_STALE_TIME_MS,
  });
  const domainMessages =
    messagesQuery.data?.pages
      .slice()
      .reverse()
      .flatMap((page) => page.items) ?? [];
  const messages =
    user
      ? domainMessages.map((message) =>
          mapMessageToUi(message, user.id, membersQuery.data ?? []),
        )
      : [];
  const error = messagesQuery.error ?? membersQuery.error;

  return {
    messages,
    isLoading: authLoading || messagesQuery.isLoading || membersQuery.isLoading,
    isError: messagesQuery.isError || membersQuery.isError,
    errorMessage: error ? getChatErrorMessage(error) : null,
    isEmpty: !messagesQuery.isLoading && messages.length === 0,
    refetch: () => {
      void messagesQuery.refetch();
      void membersQuery.refetch();
    },
    loadOlder: messagesQuery.fetchNextPage,
    hasOlderMessages: messagesQuery.hasNextPage,
    isLoadingOlder: messagesQuery.isFetchingNextPage,
  };
}
