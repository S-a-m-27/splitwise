import { authService } from "@/features/auth/services/auth.service";
import { chatPermissionService } from "@/features/chat/services/chat-permission.service";
import {
  ChatServiceError,
  normalizeChatError,
} from "@/features/chat/services/chat.errors";
import type { MessageReadReceipt } from "@/features/chat/types";
import { conversationIdSchema } from "@/features/chat/validation/chat.schema";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import type { MessageReadRow } from "@/types/database.types";

const MESSAGE_READ_SELECT = `
  id,
  conversation_id,
  user_id,
  message_id,
  read_at
`;

async function requireUserId(): Promise<string> {
  const { user, error } = await authService.getCurrentUser();

  if (error || !user) {
    throw new ChatServiceError(
      "NO_SESSION",
      "Your session has expired. Please sign in again.",
    );
  }

  return user.id;
}

function throwIfSupabaseError(error: { message: string; code?: string } | null): void {
  if (!error) return;
  const normalized = normalizeChatError(error);
  throw new ChatServiceError(normalized.code, normalized.message);
}

function mapMessageReadReceipt(row: MessageReadRow): MessageReadReceipt {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    userId: row.user_id,
    messageId: row.message_id,
    readAt: row.read_at,
  };
}

/**
 * Phase 1: read-only receipt queries. Mark-as-read RPC lands in Phase 2.
 */
export class ReadReceiptService {
  async listReadReceipts(conversationId: string): Promise<MessageReadReceipt[]> {
    const parsedConversationId = conversationIdSchema.parse(conversationId);
    const userId = await requireUserId();

    const permission = await chatPermissionService.resolveContextForUser(
      parsedConversationId,
      userId,
    );
    chatPermissionService.assertCanView(permission);

    const supabase = createBrowserClient();
    const { data, error } = await supabase
      .from("message_reads")
      .select(MESSAGE_READ_SELECT)
      .eq("conversation_id", parsedConversationId)
      .order("read_at", { ascending: false });

    throwIfSupabaseError(error);

    return (data ?? []).map(mapMessageReadReceipt);
  }
}

export const readReceiptService = new ReadReceiptService();
