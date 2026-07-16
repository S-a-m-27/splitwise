import type { ChatMessage, DisplayChatMessage } from "@/features/chat/types/ui";
import type { ConversationType } from "@/features/chat/types";
import {
  formatDateSeparator,
  isDifferentDay,
  withinMinutes,
} from "@/features/chat/utils/format-chat-time";

const GROUP_WINDOW_MINUTES = 5;

export function groupMessagesForDisplay(
  messages: ChatMessage[],
  conversationType: ConversationType,
): DisplayChatMessage[] {
  return messages.map((message, index, array) => {
    const previous = array[index - 1];
    const next = array[index + 1];

    const isGroupedWithPrevious =
      previous !== undefined &&
      previous.senderId === message.senderId &&
      !isDifferentDay(previous.createdAt, message.createdAt) &&
      withinMinutes(previous.createdAt, message.createdAt, GROUP_WINDOW_MINUTES);

    const isGroupedWithNext =
      next !== undefined &&
      next.senderId === message.senderId &&
      !isDifferentDay(message.createdAt, next.createdAt) &&
      withinMinutes(message.createdAt, next.createdAt, GROUP_WINDOW_MINUTES);

    return {
      ...message,
      showAvatar: !message.isOwn && !isGroupedWithPrevious,
      showSenderName:
        !message.isOwn &&
        conversationType === "group" &&
        !isGroupedWithPrevious,
      showTimestamp: !isGroupedWithNext,
    };
  });
}

export function insertDateSeparators(
  messages: DisplayChatMessage[],
): Array<
  | { kind: "date"; key: string; label: string }
  | { kind: "message"; key: string; message: DisplayChatMessage }
  | { kind: "unread"; key: string }
> {
  const items: Array<
    | { kind: "date"; key: string; label: string }
    | { kind: "message"; key: string; message: DisplayChatMessage }
    | { kind: "unread"; key: string }
  > = [];

  messages.forEach((message, index) => {
    const previous = messages[index - 1];

    if (
      !previous ||
      isDifferentDay(previous.createdAt, message.createdAt)
    ) {
      items.push({
        kind: "date",
        key: `date-${message.createdAt}`,
        label: formatDateSeparator(message.createdAt),
      });
    }

    items.push({ kind: "message", key: message.id, message });
  });

  return items;
}
