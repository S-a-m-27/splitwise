"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useConversations } from "@/features/chat/hooks/use-conversations";
import { chatQueryKeys } from "@/features/chat/constants/query-keys";
import { conversationService } from "@/features/chat/services/conversation.service";
import type {
  ConversationSearchResult,
  RecentSearchItem,
} from "@/features/chat/types/ui";

const EMPTY_RECENT_SEARCHES: RecentSearchItem[] = [];

export function useConversationSearch(query: string) {
  const { conversations, isLoading } = useConversations();
  const trimmed = query.trim();
  const usersQuery = useQuery({
    queryKey: [...chatQueryKeys.all, "user-search", trimmed],
    queryFn: () => conversationService.searchUsers(trimmed),
    enabled: trimmed.length >= 2,
    staleTime: 60_000,
  });

  const results = useMemo<ConversationSearchResult[]>(() => {
    if (!trimmed) return [];

    const lower = trimmed.toLowerCase();
    const conversationResults: ConversationSearchResult[] = conversations
      .filter(
        (item) =>
          item.title.toLowerCase().includes(lower) ||
          item.lastMessagePreview?.toLowerCase().includes(lower),
      )
      .map((item) => ({
        id: item.id,
        type: "conversation",
        title: item.title,
        subtitle: item.lastMessagePreview ?? undefined,
        avatarIcon: item.avatarIcon,
        avatarUrl: item.avatarUrl,
      }));
    const userResults: ConversationSearchResult[] = (usersQuery.data ?? []).map(
      (user) => ({
        id: user.id,
        type: "user",
        title: user.fullName,
        avatarUrl: user.avatarUrl ?? undefined,
      }),
    );
    return [...conversationResults, ...userResults];
  }, [conversations, trimmed, usersQuery.data]);

  return {
    results,
    recentSearches: EMPTY_RECENT_SEARCHES,
    isLoading: Boolean(trimmed) && (isLoading || usersQuery.isLoading),
    isEmpty:
      Boolean(trimmed) && !isLoading && !usersQuery.isLoading && results.length === 0,
    hasQuery: Boolean(trimmed),
  };
}
