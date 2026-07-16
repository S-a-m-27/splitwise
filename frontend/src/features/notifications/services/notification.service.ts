import { authService } from "@/features/auth/services/auth.service";
import type { AppNotification } from "@/features/notifications/types";
import { createClient } from "@/lib/supabase/client";
import type { NotificationType } from "@/types/database.types";

async function requireUserId(): Promise<string> {
  const { user, error } = await authService.getCurrentUser();
  if (error || !user) throw new Error("Your session has expired. Please sign in again.");
  return user.id;
}

function mapNotification(row: {
  id: string;
  user_id: string;
  type: NotificationType;
  invitation_id: string | null;
  group_id: string | null;
  conversation_id: string | null;
  message_id: string | null;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
}): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    invitationId: row.invitation_id,
    groupId: row.group_id,
    conversationId: row.conversation_id,
    messageId: row.message_id,
    title: row.title,
    body: row.body,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

export const notificationService = {
  async getUnreadCount(types?: NotificationType[]): Promise<number> {
    const userId = await requireUserId();
    if (types?.length) {
      const { count, error } = await createClient()
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .is("read_at", null)
        .in("type", types);
      if (error) throw error;
      return count ?? 0;
    }
    const { data, error } = await createClient().rpc("get_unread_notification_count");
    if (error) throw error;
    return typeof data === "number" ? data : 0;
  },

  async listNotifications(types?: NotificationType[]): Promise<AppNotification[]> {
    const userId = await requireUserId();
    let query = createClient()
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (types?.length) query = query.in("type", types);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapNotification);
  },

  async markAsRead(notificationId: string): Promise<void> {
    const userId = await requireUserId();
    const { error } = await createClient()
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("user_id", userId);
    if (error) throw error;
  },

  async markManyAsRead(notificationIds: string[]): Promise<void> {
    if (notificationIds.length === 0) return;
    const userId = await requireUserId();
    const { error } = await createClient()
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("read_at", null)
      .in("id", notificationIds);
    if (error) throw error;
  },
};
