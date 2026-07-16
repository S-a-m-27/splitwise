import { notificationService as sharedNotificationService } from "@/features/notifications/services/notification.service";

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

export const notificationService = {
  getUnreadCount: () =>
    sharedNotificationService.getUnreadCount([
      "invitation_received",
      "invitation_linked",
      "invitation_accepted",
      "invitation_declined",
    ]),

  async getInvitationNotifications(): Promise<InvitationNotificationRow[]> {
    const rows = await sharedNotificationService.listNotifications([
      "invitation_received",
      "invitation_linked",
      "invitation_accepted",
      "invitation_declined",
    ]);
    return rows.map((row) => ({
      id: row.id,
      user_id: row.userId,
      type: row.type as InvitationNotificationRow["type"],
      invitation_id: row.invitationId,
      group_id: row.groupId,
      title: row.title,
      body: row.body,
      read_at: row.readAt,
      created_at: row.createdAt,
    }));
  },

  markAsRead: sharedNotificationService.markAsRead,
};
