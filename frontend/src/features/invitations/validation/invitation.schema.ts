import { z } from "zod";
import {
  INVITATION_ACCEPTED_VIA,
  INVITATION_DELIVERY_CHANNEL,
  INVITATION_STATUS,
} from "@/features/invitations/constants/invitation.constants";

const deliveryChannelSchema = z.enum([
  INVITATION_DELIVERY_CHANNEL.EMAIL,
  INVITATION_DELIVERY_CHANNEL.IN_APP,
  INVITATION_DELIVERY_CHANNEL.PUSH,
  INVITATION_DELIVERY_CHANNEL.SMS,
  INVITATION_DELIVERY_CHANNEL.WHATSAPP,
  INVITATION_DELIVERY_CHANNEL.QR_CODE,
]);

export const invitationEmailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Please enter a valid email address.")
  .transform((value) => value.toLowerCase());

export const createMemberInvitationSchema = z.object({
  groupId: z.string().uuid("Invalid group id."),
  invitedEmail: invitationEmailSchema,
  isRegistered: z.boolean().optional(),
  deliveryChannels: z
    .array(deliveryChannelSchema)
    .min(1, "At least one delivery channel is required.")
    .refine(
      (channels) => !channels.includes(INVITATION_DELIVERY_CHANNEL.SHARE_LINK as never),
      "share_link is not valid for member invitations.",
    )
    .optional(),
  expiresAt: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const acceptMemberInvitationSchema = z.object({
  invitationId: z.string().uuid("Invalid invitation id."),
  acceptedVia: z
    .enum([
      INVITATION_ACCEPTED_VIA.EMAIL,
      INVITATION_ACCEPTED_VIA.APPLICATION,
      INVITATION_ACCEPTED_VIA.SHARE_LINK,
    ])
    .optional(),
});

export const invitationIdSchema = z.object({
  invitationId: z.string().uuid("Invalid invitation id."),
});

export const groupInvitationsFilterSchema = z.object({
  groupId: z.string().uuid("Invalid group id."),
  status: z
    .enum([
      INVITATION_STATUS.PENDING,
      INVITATION_STATUS.ACCEPTED,
      INVITATION_STATUS.DECLINED,
      INVITATION_STATUS.EXPIRED,
      INVITATION_STATUS.CANCELLED,
    ])
    .optional(),
});

export type CreateMemberInvitationSchema = z.infer<typeof createMemberInvitationSchema>;
export type AcceptMemberInvitationSchema = z.infer<typeof acceptMemberInvitationSchema>;
