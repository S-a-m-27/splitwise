import type {
  InvitationDeliveryChannel,
  InvitationStatus,
} from "@/features/invitations/constants/invitation.constants";

export type InviteSearchResultState = "available" | "already_member" | "invitation_pending";

export interface InviteSearchResult {
  readonly id: string;
  readonly displayName: string;
  readonly email: string;
  readonly avatarUrl: string | null;
  readonly isRegistered: boolean;
  readonly state: InviteSearchResultState;
}

export interface PendingInvitationItem {
  readonly id: string;
  readonly groupId: string;
  readonly groupName: string;
  readonly groupIcon: string;
  readonly displayName: string | null;
  readonly email: string;
  readonly avatarUrl: string | null;
  readonly status: InvitationStatus;
  readonly deliveryChannels: readonly InvitationDeliveryChannel[];
  readonly invitedAt: string;
  readonly isRegistered: boolean;
  readonly invitedByName: string;
}

export interface ReceivedInvitationItem {
  readonly id: string;
  readonly groupId: string;
  readonly groupName: string;
  readonly groupIcon: string;
  readonly invitedByName: string;
  readonly invitedAt: string;
  readonly status: InvitationStatus;
  readonly deliveryChannels: readonly InvitationDeliveryChannel[];
  readonly expiresAt: string | null;
  readonly invitedEmail: string;
}

export type InvitationEmptyVariant =
  | "no_invitations"
  | "no_search_results"
  | "no_pending"
  | "no_registered_user"
  | "waiting_for_registration";

export type InvitationErrorVariant = "network" | "permission" | "unknown";
