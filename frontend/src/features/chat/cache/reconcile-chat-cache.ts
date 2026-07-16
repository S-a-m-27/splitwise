import type { ChatDomainEvent } from "@/features/chat/events/chat-events";
import type { ConversationListItem, MessageListItem } from "@/features/chat/types";

export function reconcileMessage(
  messages: MessageListItem[],
  incoming: MessageListItem,
): MessageListItem[] {
  const index = messages.findIndex(
    (message) =>
      message.id === incoming.id ||
      (!!incoming.clientMessageId &&
        message.clientMessageId === incoming.clientMessageId),
  );
  const next = [...messages];
  if (index < 0) next.push(incoming);
  else next[index] = incoming;
  return next.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function applyInboxEvent(
  conversations: ConversationListItem[],
  event: ChatDomainEvent,
): ConversationListItem[] {
  let next = conversations;
  if (event.type === "conversation.updated") {
    next = conversations.map((item) =>
      item.id === event.conversation.id
        ? {
            ...item,
            ...event.conversation,
            title: item.title,
            avatarIcon: item.avatarIcon,
            avatarUrl: item.avatarUrl,
            participantUserIds: item.participantUserIds,
            peerUserId: item.peerUserId,
            unreadCount: item.unreadCount,
          }
        : item,
    );
  } else if (event.type === "membership.updated") {
    if (event.member.leftAt) {
      return conversations.filter((item) => item.id !== event.conversationId);
    }
    next = conversations.map((item) =>
      item.id === event.conversationId
        ? { ...item, unreadCount: event.member.unreadCount }
        : item,
    );
  }
  return [...next].sort((a, b) =>
    (b.lastMessageAt ?? b.updatedAt).localeCompare(a.lastMessageAt ?? a.updatedAt),
  );
}
