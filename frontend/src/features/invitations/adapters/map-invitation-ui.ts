import type { MemberInvitation } from "@/features/invitations/types";
import type {
  InviteSearchResult,
  PendingInvitationItem,
  ReceivedInvitationItem,
} from "@/features/invitations/types/ui";
import type { InviteSearchResultState } from "@/features/invitations/types/ui";

interface SearchCandidateRow {
  id: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  is_registered: boolean;
  state: InviteSearchResultState;
}

export function mapSearchCandidateRow(row: SearchCandidateRow): InviteSearchResult {
  return {
    id: row.id,
    displayName: row.display_name,
    email: row.email,
    avatarUrl: row.avatar_url,
    isRegistered: row.is_registered,
    state: row.state,
  };
}

export function mapMemberInvitationToPendingItem(
  invitation: MemberInvitation,
  context: {
    groupName: string;
    groupIcon: string;
    invitedByName?: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  },
): PendingInvitationItem {
  return {
    id: invitation.id,
    groupId: invitation.groupId,
    groupName: context.groupName,
    groupIcon: context.groupIcon,
    displayName: context.displayName ?? null,
    email: invitation.invitedEmail,
    avatarUrl: context.avatarUrl ?? null,
    status: invitation.status,
    deliveryChannels: invitation.deliveryChannels,
    invitedAt: invitation.createdAt,
    isRegistered: invitation.invitedUserId !== null,
    invitedByName: context.invitedByName ?? "You",
  };
}

export function mapMemberInvitationToReceivedItem(
  invitation: MemberInvitation,
  context: {
    groupName: string;
    groupIcon: string;
    invitedByName: string;
  },
): ReceivedInvitationItem {
  return {
    id: invitation.id,
    groupId: invitation.groupId,
    groupName: context.groupName,
    groupIcon: context.groupIcon,
    invitedByName: context.invitedByName,
    invitedAt: invitation.createdAt,
    status: invitation.status,
    deliveryChannels: invitation.deliveryChannels,
    expiresAt: invitation.expiresAt,
    invitedEmail: invitation.invitedEmail,
  };
}
