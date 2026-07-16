import {
  INVITATION_DELIVERY_CHANNEL,
  INVITATION_KIND,
  INVITATION_STATUS,
  type InvitationDeliveryChannel,
  type InvitationStatus,
} from "@/features/invitations/constants/invitation.constants";
import { InvitationDomainError } from "@/features/invitations/errors/invitation.errors";
import { isInvitationExpired } from "@/features/invitations/domain/invitation-state-machine";
import type { MemberInvitation } from "@/features/invitations/types";

export function normalizeInvitationEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function assertValidInvitationEmail(email: string): void {
  const normalized = normalizeInvitationEmail(email);
  const pattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

  if (!pattern.test(normalized)) {
    throw new InvitationDomainError(
      "VALIDATION_ERROR",
      "Please enter a valid email address.",
    );
  }
}

export function assertNonEmptyDeliveryChannels(
  channels: readonly InvitationDeliveryChannel[],
): void {
  if (channels.length === 0) {
    throw new InvitationDomainError(
      "VALIDATION_ERROR",
      "At least one delivery channel is required.",
    );
  }

  if (channels.includes(INVITATION_DELIVERY_CHANNEL.SHARE_LINK)) {
    throw new InvitationDomainError(
      "VALIDATION_ERROR",
      "share_link is not valid for member invitations.",
    );
  }
}

export function resolveDeliveryChannelsForInvitee(
  isRegistered: boolean,
  requested?: readonly InvitationDeliveryChannel[],
): readonly InvitationDeliveryChannel[] {
  if (requested && requested.length > 0) {
    return requested;
  }

  return isRegistered
    ? [INVITATION_DELIVERY_CHANNEL.EMAIL, INVITATION_DELIVERY_CHANNEL.IN_APP]
    : [INVITATION_DELIVERY_CHANNEL.EMAIL];
}

export function assertInvitationIsMemberKind(kind: string): void {
  if (kind !== INVITATION_KIND.MEMBER) {
    throw new InvitationDomainError(
      "INVALID_INVITATION_STATE",
      "This operation only applies to member invitations.",
    );
  }
}

export function assertInvitationIsActionable(invitation: MemberInvitation): void {
  if (invitation.status !== INVITATION_STATUS.PENDING) {
    throw new InvitationDomainError(
      "INVALID_INVITATION_STATE",
      `Invitation is ${invitation.status}, not pending.`,
    );
  }

  if (isInvitationExpired(invitation.status, invitation.expiresAt)) {
    throw new InvitationDomainError(
      "INVITATION_EXPIRED",
      "This invitation has expired.",
    );
  }
}

export function assertNotSelfInvitation(
  inviterUserId: string,
  invitedUserId: string | null,
  invitedEmail: string,
  inviterEmail?: string | null,
): void {
  if (invitedUserId && invitedUserId === inviterUserId) {
    throw new InvitationDomainError(
      "VALIDATION_ERROR",
      "You cannot invite yourself.",
    );
  }

  if (
    inviterEmail &&
    normalizeInvitationEmail(inviterEmail) === normalizeInvitationEmail(invitedEmail)
  ) {
    throw new InvitationDomainError(
      "VALIDATION_ERROR",
      "You cannot invite yourself.",
    );
  }
}

export function filterInvitationsByStatus(
  invitations: readonly MemberInvitation[],
  status?: InvitationStatus,
): MemberInvitation[] {
  if (!status) return [...invitations];
  return invitations.filter((invitation) => invitation.status === status);
}
