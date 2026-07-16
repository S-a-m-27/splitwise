import type {
  ConversationMember,
  ConversationType,
  MessageListItem,
  MessageReadReceipt,
} from "@/features/chat/types";
import type { MessageDeliveryStatus } from "@/features/chat/types/ui";

const EDIT_WINDOW_MS = 5 * 60 * 1000;

export function isMessageEditable(message: MessageListItem, now = Date.now()): boolean {
  if (message.deletedAt || message.messageType !== "text" || !message.content) {
    return false;
  }
  const createdAt = Date.parse(message.createdAt);
  if (Number.isNaN(createdAt)) return false;
  return now - createdAt <= EDIT_WINDOW_MS;
}

function isAtOrBefore(message: MessageListItem, cursor: MessageListItem): boolean {
  const messageTime = Date.parse(message.createdAt);
  const cursorTime = Date.parse(cursor.createdAt);
  if (Number.isNaN(messageTime) || Number.isNaN(cursorTime)) {
    return message.id === cursor.id;
  }
  if (messageTime < cursorTime) return true;
  if (messageTime > cursorTime) return false;
  return message.id.localeCompare(cursor.id) <= 0;
}

function peerHasReadMessage(
  peer: ConversationMember,
  message: MessageListItem,
  receipts: MessageReadReceipt[],
  messages: MessageListItem[],
): boolean {
  if (
    receipts.some(
      (receipt) =>
        receipt.messageId === message.id && receipt.userId === peer.userId,
    )
  ) {
    return true;
  }

  if (!peer.lastReadMessageId) return false;
  if (peer.lastReadMessageId === message.id) return true;

  const cursor = messages.find((item) => item.id === peer.lastReadMessageId);
  if (!cursor) return false;
  return isAtOrBefore(message, cursor);
}

export function resolveDeliveryStatus(
  message: MessageListItem,
  currentUserId: string,
  members: ConversationMember[],
  receipts: MessageReadReceipt[],
  conversationType: ConversationType,
  messages: MessageListItem[] = [],
): MessageDeliveryStatus | undefined {
  if (message.senderId !== currentUserId) return undefined;
  if (message.deliveryStatus === "sending" || message.deliveryStatus === "failed") {
    return message.deliveryStatus;
  }
  if (message.deletedAt) return "sent";

  const activePeers = members.filter(
    (member) =>
      !member.leftAt &&
      member.userId !== currentUserId,
  );
  if (activePeers.length === 0) return "sent";

  const readPeerCount = activePeers.filter((peer) =>
    peerHasReadMessage(peer, message, receipts, messages),
  ).length;

  if (conversationType === "direct") {
    return readPeerCount > 0 ? "read" : "sent";
  }

  if (readPeerCount === 0) return "sent";
  if (readPeerCount >= activePeers.length) return "read";
  return "delivered";
}

export function listSeenByReceipts(
  messageId: string,
  members: ConversationMember[],
  receipts: MessageReadReceipt[],
  currentUserId: string,
): Array<{ userId: string; displayName: string; readAt: string; avatarUrl?: string | null }> {
  const memberMap = new Map(members.map((member) => [member.userId, member]));
  return receipts
    .filter(
      (receipt) =>
        receipt.messageId === messageId && receipt.userId !== currentUserId,
    )
    .map((receipt) => {
      const member = memberMap.get(receipt.userId);
      return {
        userId: receipt.userId,
        displayName:
          member?.displayName?.trim() || member?.email || "Unknown user",
        readAt: receipt.readAt,
        avatarUrl: member?.avatarUrl,
      };
    })
    .sort((a, b) => Date.parse(b.readAt) - Date.parse(a.readAt));
}
