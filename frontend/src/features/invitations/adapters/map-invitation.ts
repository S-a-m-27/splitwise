import {
  INVITATION_KIND,
  INVITATION_STATUS,
  type InvitationDeliveryChannel,
} from "@/features/invitations/constants/invitation.constants";
import type { MemberInvitation, ShareLinkInvitation } from "@/features/invitations/types";
import type { GroupInvitationRow } from "@/types/database.types";

function parseMetadata(value: unknown): MemberInvitation["metadata"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as MemberInvitation["metadata"];
}

function parseDeliveryChannels(
  value: InvitationDeliveryChannel[] | null | undefined,
): readonly InvitationDeliveryChannel[] {
  return value ?? [];
}

export function mapMemberInvitationRow(row: GroupInvitationRow): MemberInvitation {
  if (row.kind !== INVITATION_KIND.MEMBER || !row.status) {
    throw new Error("Row is not a member invitation.");
  }

  return {
    id: row.id,
    groupId: row.group_id,
    kind: INVITATION_KIND.MEMBER,
    status: row.status,
    invitedEmail: row.invited_email ?? "",
    invitedUserId: row.invited_user_id,
    invitedByUserId: row.created_by,
    inviteCode: row.invite_code,
    deliveryChannels: parseDeliveryChannels(row.delivery_channels),
    acceptedVia: row.accepted_via,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    respondedAt: row.responded_at,
    lastReminderSentAt: row.last_reminder_sent_at,
    metadata: parseMetadata(row.metadata),
  };
}

export function mapShareLinkInvitationRow(row: GroupInvitationRow): ShareLinkInvitation {
  if (row.kind !== INVITATION_KIND.SHARE_LINK || !row.invite_code) {
    throw new Error("Row is not a share-link invitation.");
  }

  return {
    id: row.id,
    groupId: row.group_id,
    kind: INVITATION_KIND.SHARE_LINK,
    inviteCode: row.invite_code,
    createdByUserId: row.created_by,
    active: row.active,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    deliveryChannels: parseDeliveryChannels(row.delivery_channels),
  };
}

export function mapMemberInvitationRows(rows: readonly GroupInvitationRow[]): MemberInvitation[] {
  return rows
    .filter((row) => row.kind === INVITATION_KIND.MEMBER && row.status)
    .map(mapMemberInvitationRow);
}

export function isMemberInvitationRow(row: GroupInvitationRow): boolean {
  return row.kind === INVITATION_KIND.MEMBER && row.status === INVITATION_STATUS.PENDING
    ? true
    : row.kind === INVITATION_KIND.MEMBER && row.status !== null;
}
