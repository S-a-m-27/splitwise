"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { chatThreadRoute } from "@/constants/routes";
import { conversationService } from "@/features/chat/services/conversation.service";
import type { ConversationSearchResult } from "@/features/chat/types/ui";
import { chatQueryKeys } from "@/features/chat/constants/query-keys";

export function useOpenConversation() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useCallback(
    async (result: ConversationSearchResult) => {
      const conversation =
        result.type === "user"
          ? await conversationService.getOrCreateDirectConversation(result.id)
          : null;
      const conversationId = conversation?.id ?? result.id;
      await queryClient.invalidateQueries({
        queryKey: chatQueryKeys.conversations(),
      });
      router.push(chatThreadRoute(conversationId));
      return conversationId;
    },
    [queryClient, router],
  );
}
