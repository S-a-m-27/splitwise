import {
  canManageConversation,
  canSendMessage,
  canViewConversation,
} from "@/features/chat/domain/chat-permissions";
import {
  ChatServiceError,
  UnauthorizedConversationAccessError,
  normalizeChatError,
} from "@/features/chat/services/chat.errors";
import type { ChatPermissionContext } from "@/features/chat/types";
import type { ConversationMemberRole, ConversationType } from "@/types/database.types";
import { createClient as createBrowserClient } from "@/lib/supabase/client";

export class ChatPermissionService {
  buildContext(params: {
    conversationId: string;
    conversationType: ConversationType;
    groupId: string | null;
    memberRole: ConversationMemberRole | null;
    isActiveMember: boolean;
    isGroupMember: boolean;
  }): ChatPermissionContext {
    return {
      conversationId: params.conversationId,
      conversationType: params.conversationType,
      groupId: params.groupId,
      memberRole: params.memberRole,
      isActiveMember: params.isActiveMember,
      isGroupMember: params.isGroupMember,
    };
  }

  canView(ctx: ChatPermissionContext): boolean {
    return canViewConversation(ctx);
  }

  canSend(ctx: ChatPermissionContext): boolean {
    return canSendMessage(ctx);
  }

  canManage(ctx: ChatPermissionContext): boolean {
    return canManageConversation(ctx);
  }

  assertCanView(ctx: ChatPermissionContext): void {
    if (!this.canView(ctx)) {
      throw new UnauthorizedConversationAccessError();
    }
  }

  assertCanSend(ctx: ChatPermissionContext): void {
    if (!this.canSend(ctx)) {
      throw new UnauthorizedConversationAccessError(
        "You do not have permission to send messages in this conversation.",
      );
    }
  }

  async resolveContextForUser(
    conversationId: string,
    userId: string,
  ): Promise<ChatPermissionContext> {
    const supabase = createBrowserClient();

    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .select("id, type, group_id, deleted_at")
      .eq("id", conversationId)
      .maybeSingle();

    if (conversationError) {
      const normalized = normalizeChatError(conversationError);
      throw new ChatServiceError(normalized.code, normalized.message);
    }

    if (!conversation || conversation.deleted_at) {
      throw new UnauthorizedConversationAccessError();
    }

    const { data: membership, error: membershipError } = await supabase
      .from("conversation_members")
      .select("role, left_at")
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)
      .maybeSingle();

    if (membershipError) {
      const normalized = normalizeChatError(membershipError);
      throw new ChatServiceError(normalized.code, normalized.message);
    }

    const isActiveMember = Boolean(membership && !membership.left_at);

    let isGroupMember = true;
    if (conversation.type === "group" && conversation.group_id) {
      const { data: isMember, error: groupMemberError } = await supabase.rpc(
        "is_group_member",
        {
          p_group_id: conversation.group_id,
          p_user_id: userId,
        },
      );

      if (groupMemberError) {
        const normalized = normalizeChatError(groupMemberError);
        throw new ChatServiceError(normalized.code, normalized.message);
      }

      isGroupMember = Boolean(isMember);
    }

    return this.buildContext({
      conversationId,
      conversationType: conversation.type,
      groupId: conversation.group_id,
      memberRole: membership?.role ?? null,
      isActiveMember,
      isGroupMember,
    });
  }
}

export const chatPermissionService = new ChatPermissionService();
