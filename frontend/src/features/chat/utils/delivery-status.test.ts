import { describe, expect, it } from "vitest";
import {
  isMessageEditable,
  resolveDeliveryStatus,
} from "@/features/chat/utils/delivery-status";
import type {
  ConversationMember,
  MessageListItem,
  MessageReadReceipt,
} from "@/features/chat/types";

const currentUserId = "00000000-0000-4000-8000-000000000001";
const peerId = "00000000-0000-4000-8000-000000000002";

const member = (userId: string): ConversationMember => ({
  id: userId,
  conversationId: "00000000-0000-4000-8000-000000000010",
  userId,
  role: "member",
  joinedAt: "2026-07-16T10:00:00Z",
  lastReadMessageId: null,
  unreadCount: 0,
  mutedAt: null,
  archivedAt: null,
  leftAt: null,
});

const message = (overrides: Partial<MessageListItem> = {}): MessageListItem => ({
  id: "00000000-0000-4000-8000-000000000020",
  conversationId: "00000000-0000-4000-8000-000000000010",
  senderId: currentUserId,
  messageType: "text",
  content: "Hello",
  clientMessageId: null,
  replyToMessageId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  editedAt: null,
  deletedAt: null,
  ...overrides,
});

describe("delivery status", () => {
  it("keeps a single tick until the peer reads a direct message", () => {
    expect(
      resolveDeliveryStatus(
        message(),
        currentUserId,
        [member(currentUserId), member(peerId)],
        [],
        "direct",
      ),
    ).toBe("sent");
  });

  it("switches to a double blue tick after the peer reads a direct message", () => {
    const receipt: MessageReadReceipt = {
      id: "00000000-0000-4000-8000-000000000030",
      conversationId: "00000000-0000-4000-8000-000000000010",
      userId: peerId,
      messageId: "00000000-0000-4000-8000-000000000020",
      readAt: "2026-07-16T10:05:00Z",
    };
    expect(
      resolveDeliveryStatus(
        message(),
        currentUserId,
        [member(currentUserId), member(peerId)],
        [receipt],
        "direct",
      ),
    ).toBe("read");
  });

  it("uses the peer read cursor when receipts are not loaded yet", () => {
    const ownMessage = message();
    const peer = {
      ...member(peerId),
      lastReadMessageId: ownMessage.id,
    };
    expect(
      resolveDeliveryStatus(
        ownMessage,
        currentUserId,
        [member(currentUserId), peer],
        [],
        "direct",
        [ownMessage],
      ),
    ).toBe("read");
  });

  it("allows edits only within five minutes", () => {
    expect(isMessageEditable(message())).toBe(true);
    expect(
      isMessageEditable(
        message({ createdAt: "2020-01-01T00:00:00.000Z" }),
      ),
    ).toBe(false);
  });
});
