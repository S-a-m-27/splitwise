export type InvitationAction =
  | "create_member_invitation"
  | "cancel_member_invitation"
  | "accept_member_invitation"
  | "decline_member_invitation";

export const INVITATION_EDGE_FUNCTION = "invitations" as const;

export interface EdgeInvokeResult<T> {
  readonly ok: boolean;
  readonly action: InvitationAction;
  readonly data: T;
}

export interface CreateMemberInvitationEdgeResult {
  readonly invitation: Record<string, unknown>;
  readonly emailSent: boolean;
  readonly emailSkippedReason?: string;
  readonly inviteeType: "registered" | "unregistered";
}
