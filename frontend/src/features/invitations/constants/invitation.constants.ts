export const INVITATION_KIND = {
  SHARE_LINK: "share_link",
  MEMBER: "member",
} as const;

export type InvitationKind = (typeof INVITATION_KIND)[keyof typeof INVITATION_KIND];

export const INVITATION_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  DECLINED: "declined",
  EXPIRED: "expired",
  CANCELLED: "cancelled",
} as const;

export type InvitationStatus = (typeof INVITATION_STATUS)[keyof typeof INVITATION_STATUS];

export const INVITATION_DELIVERY_CHANNEL = {
  EMAIL: "email",
  IN_APP: "in_app",
  PUSH: "push",
  SMS: "sms",
  WHATSAPP: "whatsapp",
  QR_CODE: "qr_code",
  SHARE_LINK: "share_link",
} as const;

export type InvitationDeliveryChannel =
  (typeof INVITATION_DELIVERY_CHANNEL)[keyof typeof INVITATION_DELIVERY_CHANNEL];

export const INVITATION_ACCEPTED_VIA = {
  EMAIL: "email",
  APPLICATION: "application",
  SHARE_LINK: "share_link",
} as const;

export type InvitationAcceptedVia =
  (typeof INVITATION_ACCEPTED_VIA)[keyof typeof INVITATION_ACCEPTED_VIA];

/** Default channels for registered users (email + in-app). */
export const DEFAULT_MEMBER_DELIVERY_CHANNELS: readonly InvitationDeliveryChannel[] = [
  INVITATION_DELIVERY_CHANNEL.EMAIL,
  INVITATION_DELIVERY_CHANNEL.IN_APP,
];

/** Default channels for unregistered email-only invites. */
export const EMAIL_ONLY_DELIVERY_CHANNELS: readonly InvitationDeliveryChannel[] = [
  INVITATION_DELIVERY_CHANNEL.EMAIL,
];

export const TERMINAL_INVITATION_STATUSES: readonly InvitationStatus[] = [
  INVITATION_STATUS.ACCEPTED,
  INVITATION_STATUS.DECLINED,
  INVITATION_STATUS.EXPIRED,
  INVITATION_STATUS.CANCELLED,
];

export const PENDING_INVITATION_STATUS = INVITATION_STATUS.PENDING;
