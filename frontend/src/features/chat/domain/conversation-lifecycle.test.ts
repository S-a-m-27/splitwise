import { describe, expect, it } from "vitest";
import { reconcileMessage, applyInboxEvent } from "@/features/chat/cache/reconcile-chat-cache";
import {
  conversationLifecycleReducer,
  initialConversationLifecycleState,
} from "@/features/chat/domain/conversation-lifecycle";
import type {
  ConversationDetail,
  ConversationMember,
  ConversationSnapshot,
  MessageListItem,
} from "@/features/chat/types";

const conversation: ConversationDetail = {
  id: "00000000-0000-4000-8000-000000000001",
  type: "direct",
  groupId: null,
  createdBy: "00000000-0000-4000-8000-000000000002",
  lastMessageAt: null,
  lastMessagePreview: null,
  unreadCount: 0,
  updatedAt: "2026-07-16T10:00:00Z",
  createdAt: "2026-07-16T10:00:00Z",
  dmPairKey: null,
  metadata: {},
};

const member: ConversationMember = {
  id: "00000000-0000-4000-8000-000000000003",
  conversationId: conversation.id,
  userId: "00000000-0000-4000-8000-000000000002",
  role: "member",
  joinedAt: "2026-07-16T10:00:00Z",
  lastReadMessageId: null,
  unreadCount: 0,
  mutedAt: null,
  archivedAt: null,
  leftAt: null,
};

function message(id: string, clientMessageId = id): MessageListItem {
  return {
    id,
    conversationId: conversation.id,
    senderId: member.userId,
    messageType: "text",
    content: "Hello",
    clientMessageId,
    replyToMessageId: null,
    createdAt: "2026-07-16T10:01:00Z",
    updatedAt: "2026-07-16T10:01:00Z",
    editedAt: null,
    deletedAt: null,
  };
}

const snapshot: ConversationSnapshot = {
  conversation,
  members: [member],
  messages: [],
  currentMember: member,
  receipts: [],
};

describe("conversation lifecycle", () => {
  it("buffers committed events until hydration and then reconciles them", () => {
    const opening = conversationLifecycleReducer(initialConversationLifecycleState, {
      type: "OPEN",
    });
    const subscribed = conversationLifecycleReducer(opening, { type: "SUBSCRIBED" });
    const buffered = conversationLifecycleReducer(subscribed, {
      type: "EVENT",
      event: {
        type: "message.committed",
        conversationId: conversation.id,
        message: message("00000000-0000-4000-8000-000000000010"),
      },
    });
    const ready = conversationLifecycleReducer(buffered, {
      type: "HYDRATED",
      snapshot,
    });
    expect(ready.status).toBe("ready");
    expect(ready.snapshot?.messages).toHaveLength(1);
    expect(ready.bufferedEvents).toEqual([]);
  });

  it("deduplicates optimistic, RPC, and realtime copies by client message id", () => {
    const clientId = "00000000-0000-4000-8000-000000000011";
    const optimistic = message(clientId, clientId);
    const canonical = message("00000000-0000-4000-8000-000000000012", clientId);
    expect(reconcileMessage([optimistic], canonical)).toEqual([canonical]);
  });

  it("updates unread state and inbox ordering precisely", () => {
    const older = { ...conversation, id: "00000000-0000-4000-8000-000000000020" };
    const result = applyInboxEvent([older, conversation], {
      type: "membership.updated",
      conversationId: conversation.id,
      member: { ...member, unreadCount: 3 },
    });
    expect(result.find((item) => item.id === conversation.id)?.unreadCount).toBe(3);
  });

  it("turns own messages to read when a peer receipt arrives", () => {
    const ready = conversationLifecycleReducer(initialConversationLifecycleState, {
      type: "HYDRATED",
      snapshot: {
        ...snapshot,
        messages: [message("00000000-0000-4000-8000-000000000010")],
      },
    });
    const withReceipt = conversationLifecycleReducer(ready, {
      type: "EVENT",
      event: {
        type: "receipt.created",
        conversationId: conversation.id,
        receipt: {
          id: "00000000-0000-4000-8000-000000000040",
          conversationId: conversation.id,
          userId: "00000000-0000-4000-8000-000000000099",
          messageId: "00000000-0000-4000-8000-000000000010",
          readAt: "2026-07-16T10:05:00Z",
        },
      },
    });
    expect(withReceipt.snapshot?.receipts).toHaveLength(1);
  });

  it("preserves enriched member identity during realtime membership updates", () => {
    const enrichedMember = {
      ...member,
      displayName: "Khanwaiz",
      email: "khanwaiz@example.com",
      avatarUrl: "https://example.com/avatar.png",
    };
    const ready = conversationLifecycleReducer(initialConversationLifecycleState, {
      type: "HYDRATED",
      snapshot: {
        ...snapshot,
        members: [enrichedMember],
        currentMember: enrichedMember,
      },
    });
    const updated = conversationLifecycleReducer(ready, {
      type: "EVENT",
      event: {
        type: "membership.updated",
        conversationId: conversation.id,
        member: { ...member, unreadCount: 2 },
      },
    });

    expect(updated.snapshot?.members[0]).toMatchObject({
      displayName: "Khanwaiz",
      email: "khanwaiz@example.com",
      avatarUrl: "https://example.com/avatar.png",
      unreadCount: 2,
    });
  });

  it("clears ephemeral activity while reconnecting and restores it from events", () => {
    const ready = conversationLifecycleReducer(
      conversationLifecycleReducer(initialConversationLifecycleState, {
        type: "HYDRATED",
        snapshot,
      }),
      {
        type: "EVENT",
        event: {
          type: "presence.updated",
          conversationId: conversation.id,
          onlineUserIds: [member.userId],
        },
      },
    );
    const reconnecting = conversationLifecycleReducer(ready, {
      type: "RECONNECTING",
    });
    expect(reconnecting.onlineUserIds).toEqual([]);
    expect(reconnecting.typingUserIds).toEqual([]);
    expect(reconnecting.connectionStatus).toBe("reconnecting");
  });
});
