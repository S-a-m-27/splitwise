import type { NotificationType } from "@/types/database.types";

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  invitationId: string | null;
  groupId: string | null;
  conversationId: string | null;
  messageId: string | null;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}
