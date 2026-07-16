import type {
  EmailDeliveryResult,
  EmailProvider,
  InvitationEmailPayload,
} from "./types.ts";

export class NoopEmailProvider implements EmailProvider {
  readonly name = "noop";

  async sendRegisteredInvite(
    _payload: InvitationEmailPayload,
  ): Promise<EmailDeliveryResult> {
    console.log("[email:noop] Registered invite (skipped — no RESEND_API_KEY)");
    return { success: false, errorMessage: "Email provider not configured" };
  }

  async sendRegistrationInvite(
    _payload: InvitationEmailPayload,
  ): Promise<EmailDeliveryResult> {
    console.log("[email:noop] Registration invite (skipped — no RESEND_API_KEY)");
    return { success: false, errorMessage: "Email provider not configured" };
  }
}
