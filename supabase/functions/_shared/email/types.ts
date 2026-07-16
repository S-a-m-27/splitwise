export interface InvitationEmailPayload {
  invitationId: string;
  groupId: string;
  groupName: string;
  invitedEmail: string;
  inviterName: string;
  inviteCode: string | null;
  inviteUrl: string | null;
  registerUrl: string | null;
  expiresAt: string | null;
}

export interface EmailDeliveryResult {
  success: boolean;
  providerMessageId?: string;
  errorMessage?: string;
}

export interface EmailProvider {
  readonly name: string;
  sendRegisteredInvite(payload: InvitationEmailPayload): Promise<EmailDeliveryResult>;
  sendRegistrationInvite(payload: InvitationEmailPayload): Promise<EmailDeliveryResult>;
}
