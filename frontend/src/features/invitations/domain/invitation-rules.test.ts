import { describe, expect, it } from "vitest";
import {
  INVITATION_DELIVERY_CHANNEL,
} from "@/features/invitations/constants/invitation.constants";
import {
  assertNonEmptyDeliveryChannels,
  assertValidInvitationEmail,
  normalizeInvitationEmail,
  resolveDeliveryChannelsForInvitee,
} from "@/features/invitations/domain/invitation-rules";
import { InvitationDomainError } from "@/features/invitations/errors/invitation.errors";

describe("invitation-rules", () => {
  it("normalizes email addresses", () => {
    expect(normalizeInvitationEmail("  User@Example.COM ")).toBe("user@example.com");
  });

  it("rejects invalid emails", () => {
    expect(() => assertValidInvitationEmail("not-an-email")).toThrow(InvitationDomainError);
  });

  it("rejects empty delivery channels", () => {
    expect(() => assertNonEmptyDeliveryChannels([])).toThrow(InvitationDomainError);
  });

  it("rejects share_link channel for member invitations", () => {
    expect(() =>
      assertNonEmptyDeliveryChannels([INVITATION_DELIVERY_CHANNEL.SHARE_LINK]),
    ).toThrow(InvitationDomainError);
  });

  it("resolves default channels by registration state", () => {
    expect(resolveDeliveryChannelsForInvitee(true)).toEqual([
      INVITATION_DELIVERY_CHANNEL.EMAIL,
      INVITATION_DELIVERY_CHANNEL.IN_APP,
    ]);
    expect(resolveDeliveryChannelsForInvitee(false)).toEqual([
      INVITATION_DELIVERY_CHANNEL.EMAIL,
    ]);
  });
});
