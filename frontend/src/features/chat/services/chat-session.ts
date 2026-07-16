import { authService } from "@/features/auth/services/auth.service";
import { ChatServiceError, normalizeChatError } from "@/features/chat/services/chat.errors";

export async function requireChatUserId(): Promise<string> {
  const { user, error } = await authService.getCurrentUser();
  if (error || !user) {
    throw new ChatServiceError("NO_SESSION", "Your session has expired. Please sign in again.");
  }
  return user.id;
}

export function throwIfChatDataError(
  error: { message: string; code?: string } | null,
): void {
  if (!error) return;
  const normalized = normalizeChatError(error);
  throw new ChatServiceError(normalized.code, normalized.message);
}
