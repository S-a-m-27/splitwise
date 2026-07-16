import { NoopEmailProvider } from "./noop-provider.ts";
import { ResendEmailProvider } from "./resend-provider.ts";
import { SmtpEmailProvider } from "./smtp-provider.ts";
import type { EmailProvider } from "./types.ts";

export type { EmailDeliveryResult, EmailProvider, InvitationEmailPayload } from "./types.ts";
export { NoopEmailProvider } from "./noop-provider.ts";
export { ResendEmailProvider } from "./resend-provider.ts";
export { SmtpEmailProvider } from "./smtp-provider.ts";

/**
 * Provider priority:
 * 1. SMTP (Gmail, etc.) when SMTP_USER + SMTP_PASS are set
 * 2. Resend when RESEND_API_KEY is set
 * 3. Noop (logs only, no delivery)
 */
export function createEmailProvider(): EmailProvider {
  if (Deno.env.get("SMTP_USER") && Deno.env.get("SMTP_PASS")) {
    return new SmtpEmailProvider();
  }

  if (Deno.env.get("RESEND_API_KEY")) {
    return new ResendEmailProvider();
  }

  return new NoopEmailProvider();
}
