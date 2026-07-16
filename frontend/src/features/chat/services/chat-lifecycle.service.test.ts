import { describe, expect, it, vi } from "vitest";
import type { ChatEventListener } from "@/features/chat/events/chat-events";
import {
  ChatLifecycleService,
  type LifecycleDependencies,
} from "@/features/chat/services/chat-lifecycle.service";
import type {
  ConversationDetail,
  ConversationMember,
  MessageListItem,
} from "@/features/chat/types";

const conversationId = "00000000-0000-4000-8000-000000000101";
const userId = "00000000-0000-4000-8000-000000000102";
const conversation: ConversationDetail = {
  id: conversationId,
  type: "direct",
  groupId: null,
  createdBy: userId,
  lastMessageAt: null,
  lastMessagePreview: null,
  unreadCount: 0,
  updatedAt: "2026-07-16T10:00:00Z",
  createdAt: "2026-07-16T10:00:00Z",
  dmPairKey: null,
  metadata: {},
};
const member: ConversationMember = {
  id: "00000000-0000-4000-8000-000000000103",
  conversationId,
  userId,
  role: "member",
  joinedAt: "2026-07-16T10:00:00Z",
  lastReadMessageId: null,
  unreadCount: 0,
  mutedAt: null,
  archivedAt: null,
  leftAt: null,
};
const realtimeMessage: MessageListItem = {
  id: "00000000-0000-4000-8000-000000000104",
  conversationId,
  senderId: userId,
  messageType: "text",
  content: "Buffered",
  clientMessageId: "00000000-0000-4000-8000-000000000105",
  replyToMessageId: null,
  createdAt: "2026-07-16T10:01:00Z",
  updatedAt: "2026-07-16T10:01:00Z",
  editedAt: null,
  deletedAt: null,
};

describe("ChatLifecycleService", () => {
  it("subscribes before hydration, reconciles buffered events, and cleans up", async () => {
    let listener: ChatEventListener = () => undefined;
    const unsubscribe = vi.fn(async () => undefined);
    let resolveConversation!: (value: ConversationDetail) => void;
    const conversationPromise = new Promise<ConversationDetail>((resolve) => {
      resolveConversation = resolve;
    });
    const subscribeToConversation = vi.fn(
      (_id: string, _userId: string, nextListener: ChatEventListener) => {
        listener = nextListener;
        return { ready: Promise.resolve(), unsubscribe };
      },
    );
    const dependencies: LifecycleDependencies = {
      realtime: {
        subscribeToConversation,
        subscribeToConversationActivity: () => ({
          ready: Promise.resolve(),
          unsubscribe: async () => undefined,
        }),
        subscribeToInbox: () => {
          throw new Error("not used");
        },
        broadcastTyping: vi.fn(async () => undefined),
      },
      conversations: {
        getConversation: vi.fn(() => conversationPromise),
        listConversationMembers: vi.fn(async () => [member]),
      },
      messages: {
        listMessagePage: vi.fn(async () => ({ items: [], nextCursor: null })),
        sendMessage: vi.fn(async () => realtimeMessage),
        markConversationRead: vi.fn(async () => undefined),
      },
      getCurrentUserId: vi.fn(async () => userId),
    };
    const service = new ChatLifecycleService(dependencies);
    const opening = service.openConversation(conversationId);
    await vi.waitFor(() => expect(subscribeToConversation).toHaveBeenCalledOnce());
    listener({
      type: "message.committed",
      conversationId,
      message: realtimeMessage,
    });
    resolveConversation(conversation);
    const snapshot = await opening;

    expect(snapshot.messages).toEqual([realtimeMessage]);
    expect(service.getState().status).toBe("ready");
    await service.closeConversation();
    expect(unsubscribe).toHaveBeenCalledOnce();
    expect(service.getState().status).toBe("closed");
  });
});
