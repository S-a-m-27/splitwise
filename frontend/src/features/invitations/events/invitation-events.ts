import type { InvitationStatus } from "@/features/invitations/constants/invitation.constants";

/** Realtime-ready invitation lifecycle events. */
export const INVITATION_EVENT = {
  CREATED: "invitation.created",
  ACCEPTED: "invitation.accepted",
  DECLINED: "invitation.declined",
  EXPIRED: "invitation.expired",
  CANCELLED: "invitation.cancelled",
  LINKED_TO_USER: "invitation.linked_to_user",
} as const;

export type InvitationEventType =
  (typeof INVITATION_EVENT)[keyof typeof INVITATION_EVENT];

export interface InvitationRealtimePayload {
  readonly event: InvitationEventType;
  readonly invitationId: string;
  readonly groupId: string;
  readonly status: InvitationStatus | null;
  readonly invitedUserId: string | null;
  readonly invitedEmail: string | null;
  readonly occurredAt: string;
}

export function buildInvitationRealtimePayload(
  event: InvitationEventType,
  row: {
    id: string;
    group_id: string;
    status: InvitationStatus | null;
    invited_user_id: string | null;
    invited_email: string | null;
  },
  occurredAt: string = new Date().toISOString(),
): InvitationRealtimePayload {
  return {
    event,
    invitationId: row.id,
    groupId: row.group_id,
    status: row.status,
    invitedUserId: row.invited_user_id,
    invitedEmail: row.invited_email,
    occurredAt,
  };
}

/** Maps a postgres_changes UPDATE to a lifecycle event when status changes. */
export function resolveInvitationEventFromStatus(
  status: InvitationStatus,
): InvitationEventType | null {
  switch (status) {
    case "accepted":
      return INVITATION_EVENT.ACCEPTED;
    case "declined":
      return INVITATION_EVENT.DECLINED;
    case "expired":
      return INVITATION_EVENT.EXPIRED;
    case "cancelled":
      return INVITATION_EVENT.CANCELLED;
    default:
      return null;
  }
}

/** Suggested Supabase realtime filter for Phase 2 subscriptions. */
export const INVITATION_REALTIME_CHANNEL_PREFIX = "invitations";

export function buildInvitationRealtimeChannel(userId: string): string {
  return `${INVITATION_REALTIME_CHANNEL_PREFIX}:${userId}`;
}
