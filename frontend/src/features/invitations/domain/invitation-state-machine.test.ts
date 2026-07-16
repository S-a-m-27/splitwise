import { describe, expect, it } from "vitest";
import {
  INVITATION_STATUS,
} from "@/features/invitations/constants/invitation.constants";
import {
  assertInvitationTransition,
  canTransitionInvitation,
  isInvitationExpired,
  isTerminalInvitationStatus,
  resolveStatusAfterTransition,
} from "@/features/invitations/domain/invitation-state-machine";
import { InvitationDomainError } from "@/features/invitations/errors/invitation.errors";

describe("invitation-state-machine", () => {
  it("allows pending invitations to accept, decline, cancel, or expire", () => {
    expect(canTransitionInvitation(INVITATION_STATUS.PENDING, "accept")).toBe(true);
    expect(canTransitionInvitation(INVITATION_STATUS.PENDING, "decline")).toBe(true);
    expect(canTransitionInvitation(INVITATION_STATUS.PENDING, "cancel")).toBe(true);
    expect(canTransitionInvitation(INVITATION_STATUS.PENDING, "expire")).toBe(true);
  });

  it("blocks transitions from terminal states", () => {
    for (const status of [
      INVITATION_STATUS.ACCEPTED,
      INVITATION_STATUS.DECLINED,
      INVITATION_STATUS.EXPIRED,
      INVITATION_STATUS.CANCELLED,
    ]) {
      expect(canTransitionInvitation(status, "accept")).toBe(false);
      expect(isTerminalInvitationStatus(status)).toBe(true);
    }
  });

  it("resolves target status after transition", () => {
    expect(resolveStatusAfterTransition("accept")).toBe(INVITATION_STATUS.ACCEPTED);
    expect(resolveStatusAfterTransition("decline")).toBe(INVITATION_STATUS.DECLINED);
    expect(resolveStatusAfterTransition("cancel")).toBe(INVITATION_STATUS.CANCELLED);
    expect(resolveStatusAfterTransition("expire")).toBe(INVITATION_STATUS.EXPIRED);
  });

  it("throws on illegal transitions", () => {
    expect(() => assertInvitationTransition(INVITATION_STATUS.ACCEPTED, "decline")).toThrow(
      InvitationDomainError,
    );
  });

  it("detects expiry for pending invitations", () => {
    const past = new Date("2020-01-01T00:00:00.000Z").toISOString();
    expect(isInvitationExpired(INVITATION_STATUS.PENDING, past)).toBe(true);
    expect(isInvitationExpired(INVITATION_STATUS.PENDING, null)).toBe(false);
  });
});
