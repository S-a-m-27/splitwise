import { isInvitationExpired } from "@/features/invitations/domain/invitation-state-machine";
import type { InvitationStatus } from "@/features/invitations/constants/invitation.constants";
import { INVITATION_STATUS } from "@/features/invitations/constants/invitation.constants";

export function isInvitationActionable(
  status: InvitationStatus,
  expiresAt: string | null,
): boolean {
  if (status !== INVITATION_STATUS.PENDING) return false;
  return !isInvitationExpired(status, expiresAt);
}
