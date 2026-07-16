import type {
  ChatAuditEventType,
  ConversationMemberRole,
  ConversationType,
  MessageType,
} from "@/types/database.types";

export type { ConversationType, ConversationMemberRole, MessageType, ChatAuditEventType };

export interface ConversationListItem {
  id: string;
  type: ConversationType;
  groupId: string | null;
  createdBy: string;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unreadCount: number;
  updatedAt: string;
  createdAt: string;
  title?: string;
  avatarIcon?: string;
  avatarUrl?: string | null;
  participantUserIds?: string[];
  peerUserId?: string;
}

export interface ConversationDetail extends ConversationListItem {
  dmPairKey: string | null;
  metadata: Record<string, unknown>;
}

export interface ConversationMember {
  id: string;
  conversationId: string;
  userId: string;
  role: ConversationMemberRole;
  joinedAt: string;
  lastReadMessageId: string | null;
  unreadCount: number;
  mutedAt: string | null;
  archivedAt: string | null;
  leftAt: string | null;
  displayName?: string;
  avatarUrl?: string | null;
  email?: string;
}

export interface MessageListItem {
  id: string;
  conversationId: string;
  senderId: string;
  messageType: MessageType;
  content: string | null;
  clientMessageId: string | null;
  replyToMessageId: string | null;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  senderName?: string;
  senderAvatarUrl?: string | null;
  mentionedUserIds?: string[];
  deliveryStatus?: "sending" | "sent" | "failed";
}

export interface MessageReadReceipt {
  id: string;
  conversationId: string;
  userId: string;
  messageId: string;
  readAt: string;
}

export interface ChatPermissionContext {
  conversationId: string;
  conversationType: ConversationType;
  groupId: string | null;
  memberRole: ConversationMemberRole | null;
  isActiveMember: boolean;
  isGroupMember: boolean;
}

export type ConversationLifecycleStatus =
  | "idle"
  | "opening"
  | "hydrating"
  | "ready"
  | "reconnecting"
  | "error"
  | "closed";

export type ChatConnectionStatus = "disconnected" | "connecting" | "connected" | "reconnecting";

export interface ConversationPresenceState {
  conversationId: string;
  onlineUserIds: string[];
}

export interface ConversationTypingState {
  conversationId: string;
  typingUserIds: string[];
}

export interface ConversationSnapshot {
  conversation: ConversationDetail;
  members: ConversationMember[];
  messages: MessageListItem[];
  currentMember: ConversationMember;
  receipts: MessageReadReceipt[];
}

export interface EditMessageCommand {
  messageId: string;
  content: string;
}

export interface DeleteMessageCommand {
  messageId: string;
}

export interface SendMessageCommand {
  conversationId: string;
  content: string;
  clientMessageId: string;
  messageType?: MessageType;
  mentionedUserIds?: string[];
}

export interface MarkConversationReadCommand {
  conversationId: string;
  messageId: string;
}

export interface ChatNotificationSummary {
  id: string;
  conversationId: string;
  messageId: string | null;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}
