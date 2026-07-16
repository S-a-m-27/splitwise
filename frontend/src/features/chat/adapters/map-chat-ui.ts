import type {
  ConversationDetail,
  ConversationListItem,
  ConversationMember,
  MessageListItem,
} from "@/features/chat/types";
import type {
  ChatConversationPreview,
  ChatMessage,
  ChatParticipant,
} from "@/features/chat/types/ui";

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

export function mapMemberToParticipant(member: ConversationMember): ChatParticipant {
  const name = member.displayName ?? "Member";
  return {
    id: member.userId,
    name,
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
  let participants = members
    .filter((member) => member.userId !== currentUserId && !member.leftAt)
    .map((member) => ({
      ...mapMemberToParticipant(member),
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
): ChatMessage {
  const sender = members.find((member) => member.userId === message.senderId);
  const senderName =
    message.senderName ?? sender?.displayName ?? (message.senderId === currentUserId ? "You" : "Member");
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    senderName,
    senderInitials: initials(senderName),
    senderAvatarUrl: message.senderAvatarUrl ?? sender?.avatarUrl ?? undefined,
    content: message.content ?? "",
    createdAt: message.createdAt,
    isOwn: message.senderId === currentUserId,
    status:
      message.senderId === currentUserId
        ? (message.deliveryStatus ?? "sent")
        : undefined,
  };
}
