export interface InvitationEmailPayload {
  readonly invitationId: string;
  readonly groupId: string;
  readonly groupName: string;
  readonly invitedEmail: string;
  readonly inviterName: string;
  readonly inviteCode: string | null;
  readonly inviteUrl: string | null;
  readonly expiresAt: string | null;
}

export interface EmailDeliveryResult {
  readonly success: boolean;
  readonly providerMessageId?: string;
  readonly errorMessage?: string;
}

export interface EmailProvider {
  readonly name: string;
  sendInvitationEmail(payload: InvitationEmailPayload): Promise<EmailDeliveryResult>;
}
