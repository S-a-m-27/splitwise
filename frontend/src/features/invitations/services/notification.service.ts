import { authService } from "@/features/auth/services/auth.service";
import {
  InvitationServiceError,
  normalizeInvitationError,
} from "@/features/invitations/errors/invitation.errors";
import { createClient as createBrowserClient } from "@/lib/supabase/client";

export interface InvitationNotificationRow {
  readonly id: string;
  readonly user_id: string;
  readonly type:
    | "invitation_received"
    | "invitation_linked"
    | "invitation_accepted"
    | "invitation_declined";
  readonly invitation_id: string | null;
  readonly group_id: string | null;
  readonly title: string;
  readonly body: string;
  readonly read_at: string | null;
  readonly created_at: string;
}

async function requireUserId(): Promise<string> {
  const { user, error } = await authService.getCurrentUser();
  if (error || !user) {
    throw new InvitationServiceError(
      "NO_SESSION",
      "Your session has expired. Please sign in again.",
    );
  }
  return user.id;
}

function throwIfSupabaseError(error: { message: string } | null): void {
  if (!error) return;
  const normalized = normalizeInvitationError(error);
  throw new InvitationServiceError(normalized.code, normalized.message);
}

export const notificationService = {
  async getUnreadCount(): Promise<number> {
    await requireUserId();
    const supabase = createBrowserClient();
    const { data, error } = await supabase.rpc("get_unread_notification_count");
    throwIfSupabaseError(error);
    return typeof data === "number" ? data : 0;
  },

  async getInvitationNotifications(): Promise<InvitationNotificationRow[]> {
    await requireUserId();
    const supabase = createBrowserClient();
    const { data, error } = await supabase.rpc("get_invitation_notifications");
    throwIfSupabaseError(error);
    return (data ?? []) as InvitationNotificationRow[];
  },

  async markAsRead(notificationId: string): Promise<void> {
    await requireUserId();
    const supabase = createBrowserClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId);
    throwIfSupabaseError(error);
  },
};
