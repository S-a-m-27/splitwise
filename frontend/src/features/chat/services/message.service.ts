import type {
  MarkConversationReadCommand,
  MessageListItem,
  SendMessageCommand,
} from "@/features/chat/types";
import {
  markConversationReadSchema,
  parseListMessagesInput,
  sendMessageSchema,
} from "@/features/chat/validation/chat.schema";
import { mapMessageListItem } from "@/features/chat/utils/map-conversation";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import {
  requireChatUserId,
  throwIfChatDataError,
} from "@/features/chat/services/chat-session";

const MESSAGE_LIST_SELECT = `
  id,
  conversation_id,
  sender_id,
  message_type,
  content,
  client_message_id,
  reply_to_message_id,
  created_at,
  updated_at,
  edited_at,
  deleted_at,
  sender:profiles!messages_sender_id_fkey(full_name, avatar_url)
`;

/**
 * Phase 1: read-only message access. Send/update/delete arrive in Phase 2 via RPCs.
 */
export class MessageService {
  async listMessagePage(
    input: Partial<{
      conversationId: string;
      limit: number;
      before?: { createdAt: string; id: string };
    }>,
  ): Promise<{
    items: MessageListItem[];
    nextCursor: { createdAt: string; id: string } | null;
  }> {
    await requireChatUserId();
    const { conversationId, limit, before } = parseListMessagesInput(input);
    const supabase = createBrowserClient();
    let query = supabase
      .from("messages")
      .select(MESSAGE_LIST_SELECT)
      .eq("conversation_id", conversationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit);

    if (before) {
      query = query.or(
        `created_at.lt.${before.createdAt},and(created_at.eq.${before.createdAt},id.lt.${before.id})`,
      );
    }
    const { data, error } = await query;
    throwIfChatDataError(error);
    const rows = data ?? [];
    return {
      items: rows.map((row) => mapMessageListItem(row as never)).reverse(),
      nextCursor:
        rows.length === limit && rows.at(-1)
          ? { createdAt: rows.at(-1)!.created_at, id: rows.at(-1)!.id }
          : null,
    };
  }

  async listMessages(
    input: Partial<{
      conversationId: string;
      limit: number;
      before?: { createdAt: string; id: string };
    }>,
  ): Promise<MessageListItem[]> {
    return (await this.listMessagePage(input)).items;
  }

  async getMessage(messageId: string): Promise<MessageListItem | null> {
    await requireChatUserId();
    const supabase = createBrowserClient();

    const { data, error } = await supabase
      .from("messages")
      .select(MESSAGE_LIST_SELECT)
      .eq("id", messageId)
      .is("deleted_at", null)
      .maybeSingle();

    throwIfChatDataError(error);

    if (!data) return null;

    return mapMessageListItem(data as never);
  }

  async sendMessage(command: SendMessageCommand): Promise<MessageListItem> {
    const input = sendMessageSchema.parse(command);
    await requireChatUserId();
    const supabase = createBrowserClient();
    const { data, error } = await supabase.rpc("send_chat_message", {
      p_conversation_id: input.conversationId,
      p_content: input.content,
      p_client_message_id: input.clientMessageId,
      p_message_type: input.messageType,
      p_reply_to_message_id: null,
    });
    throwIfChatDataError(error);
    return mapMessageListItem(data as never);
  }

  async markConversationRead(command: MarkConversationReadCommand): Promise<void> {
    const input = markConversationReadSchema.parse(command);
    await requireChatUserId();
    const supabase = createBrowserClient();
    const { error } = await supabase.rpc("mark_conversation_read", {
      p_conversation_id: input.conversationId,
      p_message_id: input.messageId,
    });
    throwIfChatDataError(error);
  }
}

export const messageService = new MessageService();
