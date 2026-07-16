"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { mapConversationToUi } from "@/features/chat/adapters/map-chat-ui";
import { chatQueryKeys } from "@/features/chat/constants/query-keys";
import { conversationService } from "@/features/chat/services/conversation.service";

export function useGroupConversation(groupId: string) {
  const { user, isAuthenticated } = useAuth();
  return useQuery({
    queryKey: chatQueryKeys.groupConversation(groupId),
    queryFn: async () => {
      const conversation = await conversationService.getGroupConversation(groupId);
      const members = await conversationService.listConversationMembers(conversation.id);
      return mapConversationToUi(conversation, members, user?.id);
    },
    enabled: isAuthenticated && !!user?.id && !!groupId,
  });
}
