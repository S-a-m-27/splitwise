import type { ChatPermissionContext } from "@/features/chat/types";
import type { ConversationMemberRole, ConversationType } from "@/types/database.types";

const ADMIN_ROLES: ConversationMemberRole[] = ["owner", "admin", "moderator"];

const READ_ONLY_CONVERSATION_TYPES: ConversationType[] = ["announcement"];

export function canViewConversation(ctx: ChatPermissionContext): boolean {
  if (!ctx.isActiveMember) return false;
  if (ctx.conversationType === "group" && !ctx.isGroupMember) return false;
  return true;
}

export function canSendMessage(ctx: ChatPermissionContext): boolean {
  if (!canViewConversation(ctx)) return false;
  if (READ_ONLY_CONVERSATION_TYPES.includes(ctx.conversationType)) return false;
  if (ctx.memberRole === null) return false;
  return true;
}

export function canManageConversation(ctx: ChatPermissionContext): boolean {
  if (!canViewConversation(ctx)) return false;
  if (ctx.memberRole === null) return false;
  return ADMIN_ROLES.includes(ctx.memberRole);
}

export function canDeleteMessage(
  ctx: ChatPermissionContext,
  senderId: string,
  currentUserId: string,
): boolean {
  if (!canViewConversation(ctx)) return false;
  if (senderId === currentUserId) return true;
  return canManageConversation(ctx);
}

export function canPinMessage(ctx: ChatPermissionContext): boolean {
  return canManageConversation(ctx);
}

export function canReactToMessage(ctx: ChatPermissionContext): boolean {
  return canViewConversation(ctx);
}
