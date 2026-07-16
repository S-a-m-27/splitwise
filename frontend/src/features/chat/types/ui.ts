import type { ConversationType } from "@/features/chat/types";

export interface ChatParticipant {
  id: string;
  name: string;
  email?: string;
  initials: string;
  avatarUrl?: string;
  isOnline?: boolean;
}

export interface ChatConversationPreview {
  id: string;
  type: ConversationType;
  groupId: string | null;
  title: string;
  subtitle?: string;
  avatarIcon?: string;
  avatarUrl?: string;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  /** Placeholder — future pin */
  isPinned?: boolean;
  /** Placeholder — future mute */
  isMuted?: boolean;
  memberCount?: number;
  onlineCount?: number;
  participants?: ChatParticipant[];
}

export type MessageDeliveryStatus = "sending" | "sent" | "delivered" | "read" | "failed";

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderEmail?: string;
  senderInitials: string;
  senderAvatarUrl?: string;
  content: string;
  mentionedUserIds: string[];
  mentionLabels: string[];
  createdAt: string;
  editedAt?: string | null;
  deletedAt?: string | null;
  isOwn: boolean;
  isEditable?: boolean;
  seenByCount?: number;
  status?: MessageDeliveryStatus;
}

export interface MessageSeenByItem {
  userId: string;
  displayName: string;
  readAt: string;
  avatarUrl?: string | null;
}

export interface DisplayChatMessage extends ChatMessage {
  showAvatar: boolean;
  showSenderName: boolean;
  showTimestamp: boolean;
}

export type ConversationSearchResultType = "conversation" | "user" | "group";

export interface ConversationSearchResult {
  id: string;
  type: ConversationSearchResultType;
  conversationType?: ConversationType;
  title: string;
  subtitle?: string;
  avatarIcon?: string;
  avatarUrl?: string;
  initials?: string;
}

export interface RecentSearchItem {
  id: string;
  query: string;
  searchedAt: string;
}
