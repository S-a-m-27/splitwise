import type {
  EmailDeliveryResult,
  EmailProvider,
  InvitationEmailPayload,
} from "./types.ts";
import {
  buildRegisteredInviteHtml,
  buildRegisteredInviteSubject,
  buildRegisteredInviteText,
  buildRegistrationInviteHtml,
  buildRegistrationInviteSubject,
  buildRegistrationInviteText,
} from "./templates.ts";

const RESEND_API_URL = "https://api.resend.com/emails";

async function sendViaResend(
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<EmailDeliveryResult> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from =
    Deno.env.get("RESEND_FROM_EMAIL") ?? "Splitwise <onboarding@resend.dev>";

  if (!apiKey) {
    return { success: false, errorMessage: "RESEND_API_KEY not configured" };
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html, text }),
  });

  if (!response.ok) {
    const text = await response.text();
    return { success: false, errorMessage: text };
  }

  const data = (await response.json()) as { id?: string };
  return { success: true, providerMessageId: data.id };
}

export class ResendEmailProvider implements EmailProvider {
  readonly name = "resend";

  async sendRegisteredInvite(
    payload: InvitationEmailPayload,
  ): Promise<EmailDeliveryResult> {
    return sendViaResend(
      payload.invitedEmail,
      buildRegisteredInviteSubject(payload),
      buildRegisteredInviteHtml(payload),
      buildRegisteredInviteText(payload),
    );
  }

  async sendRegistrationInvite(
    payload: InvitationEmailPayload,
  ): Promise<EmailDeliveryResult> {
    return sendViaResend(
      payload.invitedEmail,
      buildRegistrationInviteSubject(payload),
      buildRegistrationInviteHtml(payload),
      buildRegistrationInviteText(payload),
    );
  }
}
