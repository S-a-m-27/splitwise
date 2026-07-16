import type {
  ConversationDetail,
  ConversationMember,
  MessageListItem,
} from "@/features/chat/types";

export type ChatDomainEvent =
  | { type: "message.committed"; conversationId: string; message: MessageListItem }
  | { type: "message.updated"; conversationId: string; message: MessageListItem }
  | { type: "message.deleted"; conversationId: string; messageId: string }
  | { type: "conversation.updated"; conversation: ConversationDetail }
  | { type: "membership.updated"; conversationId: string; member: ConversationMember }
  | {
      type: "read-state.updated";
      conversationId: string;
      userId: string;
      messageId: string | null;
      unreadCount: number;
    }
  | { type: "presence.updated"; conversationId: string; onlineUserIds: string[] }
  | { type: "typing.updated"; conversationId: string; typingUserIds: string[] }
  | { type: "connection.changed"; status: "connected" | "reconnecting" | "disconnected" };

export type ChatEventListener = (event: ChatDomainEvent) => void;
