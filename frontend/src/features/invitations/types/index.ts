import {
  INVITATION_KIND,
  type InvitationAcceptedVia,
  type InvitationDeliveryChannel,
  type InvitationStatus,
} from "@/features/invitations/constants/invitation.constants";

export interface InvitationMetadata {
  readonly [key: string]: string | number | boolean | null | undefined;
}

/** Domain model for a directed member invitation (lifecycle-managed). */
export interface MemberInvitation {
  readonly id: string;
  readonly groupId: string;
  readonly kind: typeof INVITATION_KIND.MEMBER;
  readonly status: InvitationStatus;
  readonly invitedEmail: string;
  readonly invitedUserId: string | null;
  readonly invitedByUserId: string;
  readonly inviteCode: string | null;
  readonly deliveryChannels: readonly InvitationDeliveryChannel[];
  readonly acceptedVia: InvitationAcceptedVia | null;
  readonly expiresAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly respondedAt: string | null;
  readonly lastReminderSentAt: string | null;
  readonly metadata: InvitationMetadata;
}

/** Share-link invitation token (legacy delivery channel, no lifecycle status). */
export interface ShareLinkInvitation {
  readonly id: string;
  readonly groupId: string;
  readonly kind: typeof INVITATION_KIND.SHARE_LINK;
  readonly inviteCode: string;
  readonly createdByUserId: string;
  readonly active: boolean;
  readonly expiresAt: string | null;
  readonly createdAt: string;
  readonly deliveryChannels: readonly InvitationDeliveryChannel[];
}

export type Invitation = MemberInvitation | ShareLinkInvitation;

export interface CreateMemberInvitationInput {
  readonly groupId: string;
  readonly invitedEmail: string;
  readonly isRegistered?: boolean;
  readonly deliveryChannels?: readonly InvitationDeliveryChannel[];
  readonly expiresAt?: string | null;
  readonly metadata?: InvitationMetadata;
}

export interface AcceptMemberInvitationInput {
  readonly invitationId: string;
  readonly acceptedVia?: InvitationAcceptedVia;
}

export interface InvitationListFilters {
  readonly groupId?: string;
  readonly status?: InvitationStatus;
}
