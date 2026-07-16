import nodemailer from "npm:nodemailer@6.9.16";
import type {
  EmailDeliveryResult,
  EmailProvider,
  InvitationEmailPayload,
} from "./types.ts";
import {
  buildRegisteredInviteHtml,
  buildRegisteredInviteSubject,
  buildRegistrationInviteHtml,
  buildRegistrationInviteSubject,
} from "./templates.ts";

function getSmtpConfig() {
  const host = Deno.env.get("SMTP_HOST") ?? "smtp.gmail.com";
  const port = Number(Deno.env.get("SMTP_PORT") ?? "587");
  const user = Deno.env.get("SMTP_USER");
  const pass = Deno.env.get("SMTP_PASS");
  const from =
    Deno.env.get("SMTP_FROM_EMAIL") ??
    Deno.env.get("SMTP_FROM") ??
    (user ? `ExpenseShare <${user}>` : undefined);

  return { host, port, user, pass, from };
}

async function sendViaSmtp(
  to: string,
  subject: string,
  html: string,
): Promise<EmailDeliveryResult> {
  const { host, port, user, pass, from } = getSmtpConfig();

  if (!user || !pass) {
    return { success: false, errorMessage: "SMTP_USER and SMTP_PASS are required" };
  }

  if (!from) {
    return { success: false, errorMessage: "SMTP_FROM_EMAIL is required" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    return {
      success: true,
      providerMessageId: info.messageId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "SMTP delivery failed";
    console.error("[email:smtp]", message);
    return { success: false, errorMessage: message };
  }
}

/** Gmail / Google Workspace SMTP (App Password required). */
export class SmtpEmailProvider implements EmailProvider {
  readonly name = "smtp";

  async sendRegisteredInvite(
    payload: InvitationEmailPayload,
  ): Promise<EmailDeliveryResult> {
    return sendViaSmtp(
      payload.invitedEmail,
      buildRegisteredInviteSubject(payload.groupName),
      buildRegisteredInviteHtml(payload),
    );
  }

  async sendRegistrationInvite(
    payload: InvitationEmailPayload,
  ): Promise<EmailDeliveryResult> {
    return sendViaSmtp(
      payload.invitedEmail,
      buildRegistrationInviteSubject(payload.groupName),
      buildRegistrationInviteHtml(payload),
    );
  }
}
