import nodemailer from "npm:nodemailer@6.9.16";
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

function getSmtpConfig() {
  const host = Deno.env.get("SMTP_HOST") ?? "smtp.gmail.com";
  const port = Number(Deno.env.get("SMTP_PORT") ?? "587");
  const user = Deno.env.get("SMTP_USER");
  const pass = Deno.env.get("SMTP_PASS");
  const from =
    Deno.env.get("SMTP_FROM_EMAIL") ??
    Deno.env.get("SMTP_FROM") ??
    (user ? `Splitwise <${user}>` : undefined);
  const replyTo = Deno.env.get("SMTP_REPLY_TO") ?? user;

  return { host, port, user, pass, from, replyTo };
}

async function sendViaSmtp(
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<EmailDeliveryResult> {
  const { host, port, user, pass, from, replyTo } = getSmtpConfig();

  if (!user || !pass) {
    return {
      success: false,
      errorMessage: "SMTP_USER and SMTP_PASS are required",
    };
  }

  if (!from) {
    return { success: false, errorMessage: "SMTP_FROM_EMAIL is required" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      requireTLS: port === 587,
      auth: { user, pass },
      tls: { minVersion: "TLSv1.2" },
    });

    const info = await transporter.sendMail({
      from,
      to,
      replyTo,
      subject,
      text,
      html,
    });

    return {
      success: true,
      providerMessageId: info.messageId,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "SMTP delivery failed";
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
      buildRegisteredInviteSubject(payload),
      buildRegisteredInviteHtml(payload),
      buildRegisteredInviteText(payload),
    );
  }

  async sendRegistrationInvite(
    payload: InvitationEmailPayload,
  ): Promise<EmailDeliveryResult> {
    return sendViaSmtp(
      payload.invitedEmail,
      buildRegistrationInviteSubject(payload),
      buildRegistrationInviteHtml(payload),
      buildRegistrationInviteText(payload),
    );
  }
}
