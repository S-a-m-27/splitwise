import type {
  ConversationDetail,
  ConversationListItem,
  ConversationMember,
  MessageListItem,
} from "@/features/chat/types";
import type {
  ConversationMemberRole,
  ConversationType,
  Json,
  MessageType,
} from "@/types/database.types";

interface ConversationListRow {
  id: string;
  type: ConversationType;
  group_id: string | null;
  created_by: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  created_at: string;
  updated_at: string;
  conversation_members?: Array<{ unread_count: number }>;
  unread_count?: number;
}

interface ConversationDetailRow {
  id: string;
  type: ConversationType;
  group_id: string | null;
  created_by: string;
  dm_pair_key: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  metadata?: Json | null;
  created_at: string;
  updated_at: string;
}

interface ConversationMemberRow {
  id: string;
  conversation_id: string;
  user_id: string;
  role: ConversationMemberRole;
  joined_at: string;
  last_read_message_id: string | null;
  unread_count: number;
  muted_at: string | null;
  archived_at: string | null;
  left_at: string | null;
  profile?: { full_name: string; avatar_url: string | null } | null;
  full_name?: string;
  avatar_url?: string | null;
  email?: string | null;
}

interface MessageListRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_type: MessageType;
  content: string | null;
  client_message_id: string | null;
  reply_to_message_id: string | null;
  created_at: string;
  updated_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  metadata?: Json | null;
  sender?: { full_name: string; avatar_url: string | null } | null;
}

function mentionedUserIds(metadata: Json | null | undefined): string[] {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return [];
  const value = metadata.mentioned_user_ids;
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function mapConversationListItem(row: ConversationListRow): ConversationListItem {
  const membership = row.conversation_members?.[0];

  return {
    id: row.id,
    type: row.type,
    groupId: row.group_id,
    createdBy: row.created_by,
    lastMessageAt: row.last_message_at,
    lastMessagePreview: row.last_message_preview,
    unreadCount: membership?.unread_count ?? row.unread_count ?? 0,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  };
}

export function mapConversationDetail(row: ConversationDetailRow): ConversationDetail {
  return {
    id: row.id,
    type: row.type,
    groupId: row.group_id,
    createdBy: row.created_by,
    lastMessageAt: row.last_message_at,
    lastMessagePreview: row.last_message_preview,
    unreadCount: 0,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
    dmPairKey: row.dm_pair_key,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
  };
}

export function mapConversationMember(row: ConversationMemberRow): ConversationMember {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    userId: row.user_id,
    role: row.role,
    joinedAt: row.joined_at,
    lastReadMessageId: row.last_read_message_id,
    unreadCount: row.unread_count,
    mutedAt: row.muted_at,
    archivedAt: row.archived_at,
    leftAt: row.left_at,
    displayName: row.full_name ?? row.profile?.full_name,
    avatarUrl: row.avatar_url ?? row.profile?.avatar_url,
    email: row.email ?? undefined,
  };
}

export function mapMessageListItem(row: MessageListRow): MessageListItem {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    messageType: row.message_type,
    content: row.content,
    clientMessageId: row.client_message_id,
    replyToMessageId: row.reply_to_message_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    editedAt: row.edited_at,
    deletedAt: row.deleted_at,
    mentionedUserIds: mentionedUserIds(row.metadata),
    senderName: row.sender?.full_name,
    senderAvatarUrl: row.sender?.avatar_url,
  };
}
