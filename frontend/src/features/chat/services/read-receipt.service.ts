import type { MessageReadReceipt } from "@/features/chat/types";
import { conversationIdSchema } from "@/features/chat/validation/chat.schema";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import {
  requireChatUserId,
  throwIfChatDataError,
} from "@/features/chat/services/chat-session";
import type { MessageReadRow } from "@/types/database.types";

const MESSAGE_READ_SELECT = `
  id,
  conversation_id,
  user_id,
  message_id,
  read_at
`;

function mapMessageReadReceipt(row: MessageReadRow): MessageReadReceipt {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    userId: row.user_id,
    messageId: row.message_id,
    readAt: row.read_at,
  };
}

export class ReadReceiptService {
  async listReadReceipts(conversationId: string): Promise<MessageReadReceipt[]> {
    const parsedConversationId = conversationIdSchema.parse(conversationId);
    await requireChatUserId();

    const supabase = createBrowserClient();
    const { data, error } = await supabase
      .from("message_reads")
      .select(MESSAGE_READ_SELECT)
      .eq("conversation_id", parsedConversationId)
      .order("read_at", { ascending: false });

    throwIfChatDataError(error);

    return (data ?? []).map(mapMessageReadReceipt);
  }
}

export const readReceiptService = new ReadReceiptService();
