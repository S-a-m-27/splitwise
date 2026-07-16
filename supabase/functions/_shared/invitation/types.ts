export type InvitationDeliveryChannel =
  | "email"
  | "in_app"
  | "push"
  | "sms"
  | "whatsapp"
  | "qr_code"
  | "share_link";

export type InvitationStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "expired"
  | "cancelled";

export interface GroupInvitationRow {
  id: string;
  group_id: string;
  kind: string;
  status: InvitationStatus | null;
  invite_code: string | null;
  invited_email: string | null;
  invited_user_id: string | null;
  created_by: string;
  expires_at: string | null;
  active: boolean;
  delivery_channels: InvitationDeliveryChannel[];
  accepted_via: string | null;
  created_at: string;
  updated_at: string;
  responded_at: string | null;
  last_reminder_sent_at: string | null;
  metadata: Record<string, unknown>;
}

export interface CreateMemberInvitationPayload {
  groupId: string;
  invitedEmail: string;
  deliveryChannels?: InvitationDeliveryChannel[];
  expiresAt?: string | null;
  metadata?: Record<string, unknown>;
}

export type InvitationAction =
  | "create_member_invitation"
  | "accept_member_invitation"
  | "decline_member_invitation"
  | "cancel_member_invitation";

export interface InvitationRequestBody {
  action: InvitationAction;
  payload?: Record<string, unknown>;
}

export interface CreateMemberInvitationResult {
  invitation: GroupInvitationRow;
  emailSent: boolean;
  emailSkippedReason?: string;
  inviteeType: "registered" | "unregistered";
}
