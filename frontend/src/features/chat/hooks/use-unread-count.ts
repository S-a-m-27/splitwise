"use client";

import { useMemo } from "react";
import { useConversations } from "@/features/chat/hooks/use-conversations";

export function useUnreadCount(): number {
  const { conversations } = useConversations();
  return useMemo(
    () =>
      conversations.reduce((total, conversation) => total + conversation.unreadCount, 0),
    [conversations],
  );
}
