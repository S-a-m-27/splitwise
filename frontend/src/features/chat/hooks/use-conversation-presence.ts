"use client";

import { useEffect, useState } from "react";
import { chatRealtimeService } from "@/features/chat/services/chat-realtime.service";

const EMPTY_PRESENCE: ReadonlyMap<string, string[]> = new Map();

export function useConversationPresence(
  conversationIds: string[],
  userId: string | undefined,
): ReadonlyMap<string, string[]> {
  const subscriptionKey = [...conversationIds].sort().join(",");
  const [presence, setPresence] = useState<ReadonlyMap<string, string[]>>(
    () => new Map(),
  );

  useEffect(() => {
    if (!userId || !subscriptionKey) {
      return;
    }

    let active = true;
    const ids = subscriptionKey.split(",");
    const subscriptions = ids.map((conversationId) =>
      chatRealtimeService.subscribeToConversationActivity(
        conversationId,
        userId,
        (event) => {
          if (!active || event.type !== "presence.updated") return;
          setPresence((current) => {
            const previous = current.get(event.conversationId) ?? [];
            if (
              previous.length === event.onlineUserIds.length &&
              previous.every(
                (userId, index) => userId === event.onlineUserIds[index],
              )
            ) {
              return current;
            }
            const next = new Map(current);
            next.set(event.conversationId, event.onlineUserIds);
            return next;
          });
        },
      ),
    );

    return () => {
      active = false;
      for (const subscription of subscriptions) {
        void subscription.unsubscribe();
      }
    };
  }, [subscriptionKey, userId]);

  return userId && subscriptionKey ? presence : EMPTY_PRESENCE;
}
