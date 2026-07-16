import {
  INVITATION_STATUS,
  TERMINAL_INVITATION_STATUSES,
  type InvitationStatus,
} from "@/features/invitations/constants/invitation.constants";
import { InvitationDomainError } from "@/features/invitations/errors/invitation.errors";

export type InvitationTransitionAction =
  | "accept"
  | "decline"
  | "cancel"
  | "expire";

const ALLOWED_TRANSITIONS: Readonly<
  Record<InvitationStatus, readonly InvitationTransitionAction[]>
> = {
  [INVITATION_STATUS.PENDING]: ["accept", "decline", "cancel", "expire"],
  [INVITATION_STATUS.ACCEPTED]: [],
  [INVITATION_STATUS.DECLINED]: [],
  [INVITATION_STATUS.EXPIRED]: [],
  [INVITATION_STATUS.CANCELLED]: [],
};

export function canTransitionInvitation(
  currentStatus: InvitationStatus,
  action: InvitationTransitionAction,
): boolean {
  return ALLOWED_TRANSITIONS[currentStatus].includes(action);
}

export function assertInvitationTransition(
  currentStatus: InvitationStatus,
  action: InvitationTransitionAction,
): void {
  if (!canTransitionInvitation(currentStatus, action)) {
    throw new InvitationDomainError(
      "INVALID_INVITATION_STATE",
      `Cannot ${action} an invitation in status "${currentStatus}".`,
    );
  }
}

export function resolveStatusAfterTransition(
  action: InvitationTransitionAction,
): InvitationStatus {
  switch (action) {
    case "accept":
      return INVITATION_STATUS.ACCEPTED;
    case "decline":
      return INVITATION_STATUS.DECLINED;
    case "cancel":
      return INVITATION_STATUS.CANCELLED;
    case "expire":
      return INVITATION_STATUS.EXPIRED;
    default: {
      const exhaustive: never = action;
      throw new InvitationDomainError(
        "INVALID_INVITATION_STATE",
        `Unknown transition action: ${String(exhaustive)}`,
      );
    }
  }
}

export function isTerminalInvitationStatus(status: InvitationStatus): boolean {
  return TERMINAL_INVITATION_STATUSES.includes(status);
}

export function isInvitationExpired(
  status: InvitationStatus,
  expiresAt: string | null,
  now: Date = new Date(),
): boolean {
  if (status !== INVITATION_STATUS.PENDING) {
    return status === INVITATION_STATUS.EXPIRED;
  }

  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < now.getTime();
}
