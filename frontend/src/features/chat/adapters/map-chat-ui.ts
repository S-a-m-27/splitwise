import type {
  ConversationDetail,
  ConversationListItem,
  ConversationMember,
  ConversationType,
  MessageListItem,
  MessageReadReceipt,
} from "@/features/chat/types";
import type {
  ChatConversationPreview,
  ChatMessage,
  ChatParticipant,
} from "@/features/chat/types/ui";
import {
  isMessageEditable,
  resolveDeliveryStatus,
} from "@/features/chat/utils/delivery-status";

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

function normalizedName(name: string | undefined): string {
  return name?.trim().toLocaleLowerCase() ?? "";
}

export function mapMemberToParticipant(
  member: ConversationMember,
  showEmail = false,
): ChatParticipant {
  const name = member.displayName?.trim() || member.email || "Unknown user";
  return {
    id: member.userId,
    name,
    email: showEmail ? member.email : undefined,
    initials: initials(name),
    avatarUrl: member.avatarUrl ?? undefined,
  };
}

export function mapConversationToUi(
  conversation: ConversationListItem | ConversationDetail,
  members: ConversationMember[] = [],
  currentUserId?: string,
  onlineUserIds: string[] = [],
): ChatConversationPreview {
  const activeMembers = members.filter((member) => !member.leftAt);
  const nameCounts = new Map<string, number>();
  for (const member of activeMembers) {
    const key = normalizedName(member.displayName);
    if (key) nameCounts.set(key, (nameCounts.get(key) ?? 0) + 1);
  }
  let participants = activeMembers
    .filter((member) => member.userId !== currentUserId)
    .map((member) => ({
      ...mapMemberToParticipant(
        member,
        (nameCounts.get(normalizedName(member.displayName)) ?? 0) > 1,
      ),
      isOnline: onlineUserIds.includes(member.userId),
    }));
  if (
    participants.length === 0 &&
    conversation.type === "direct" &&
    conversation.peerUserId
  ) {
    const name = conversation.title ?? "Member";
    participants = [
      {
        id: conversation.peerUserId,
        name,
        initials: initials(name),
        avatarUrl: conversation.avatarUrl ?? undefined,
        isOnline: onlineUserIds.includes(conversation.peerUserId),
      },
    ];
  }
  return {
    id: conversation.id,
    type: conversation.type,
    groupId: conversation.groupId,
    title: conversation.title ?? (conversation.type === "group" ? "Group" : "Direct message"),
    avatarIcon: conversation.avatarIcon,
    avatarUrl: conversation.avatarUrl ?? undefined,
    lastMessagePreview: conversation.lastMessagePreview,
    lastMessageAt: conversation.lastMessageAt,
    unreadCount: conversation.unreadCount,
    memberCount:
      members.filter((member) => !member.leftAt).length ||
      conversation.participantUserIds?.length ||
      undefined,
    onlineCount: onlineUserIds.length,
    participants: participants.length ? participants : undefined,
  };
}

export function mapMessageToUi(
  message: MessageListItem,
  currentUserId: string,
  members: ConversationMember[] = [],
  receipts: MessageReadReceipt[] = [],
  conversationType: ConversationType = "direct",
  messages: MessageListItem[] = [],
): ChatMessage {
  const sender = members.find((member) => member.userId === message.senderId);
  const senderName =
    message.senderName?.trim() ||
    sender?.displayName?.trim() ||
    sender?.email ||
    (message.senderId === currentUserId ? "You" : "Unknown user");
  const duplicateNameCount = members.filter(
    (member) =>
      !member.leftAt &&
      normalizedName(member.displayName) === normalizedName(sender?.displayName),
  ).length;
  const mentionedUserIds = message.mentionedUserIds ?? [];
  const mentionedIdSet = new Set(mentionedUserIds);
  const isOwn = message.senderId === currentUserId;
  const seenByCount = receipts.filter(
    (receipt) =>
      receipt.messageId === message.id && receipt.userId !== currentUserId,
  ).length;
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    senderName,
    senderEmail:
      message.senderId !== currentUserId && duplicateNameCount > 1
        ? sender?.email
        : undefined,
    senderInitials: initials(senderName),
    senderAvatarUrl: message.senderAvatarUrl ?? sender?.avatarUrl ?? undefined,
    content: message.deletedAt
      ? "This message was deleted"
      : (message.content ?? ""),
    mentionedUserIds,
    mentionLabels: members
      .filter((member) => mentionedIdSet.has(member.userId))
      .map((member) => member.displayName?.trim() || member.email || "")
      .filter(Boolean),
    createdAt: message.createdAt,
    editedAt: message.editedAt,
    deletedAt: message.deletedAt,
    isOwn,
    isEditable: isOwn && isMessageEditable(message),
    seenByCount: isOwn ? seenByCount : undefined,
    status: isOwn
      ? resolveDeliveryStatus(
          message,
          currentUserId,
          members,
          receipts,
          conversationType,
          messages,
        )
      : undefined,
  };
}
