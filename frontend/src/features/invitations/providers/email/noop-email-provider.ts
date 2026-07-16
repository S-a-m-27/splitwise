import type {
  EmailDeliveryResult,
  EmailProvider,
  InvitationEmailPayload,
} from "@/features/invitations/providers/email/email-provider.interface";

/** No-op provider for Phase 1 — email sending wired in Phase 2 via Edge Functions. */
export class NoopEmailProvider implements EmailProvider {
  readonly name = "noop";

  async sendInvitationEmail(_payload: InvitationEmailPayload): Promise<EmailDeliveryResult> {
    return { success: true };
  }
}

export const defaultEmailProvider = new NoopEmailProvider();
