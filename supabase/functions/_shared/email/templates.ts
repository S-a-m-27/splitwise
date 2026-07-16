import type { InvitationEmailPayload } from "./types.ts";

const BRAND = Deno.env.get("APP_NAME") ?? "ExpenseShare";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(BRAND)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <tr>
            <td style="padding:28px 24px 8px;font-size:22px;font-weight:700;color:#111827;">${escapeHtml(BRAND)}</td>
          </tr>
          <tr>
            <td style="padding:8px 24px 24px;color:#374151;font-size:16px;line-height:1.6;">
              ${content}
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">You received this because someone invited you on ${escapeHtml(BRAND)}.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function button(href: string, label: string): string {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `<p style="margin:24px 0 8px;">
    <a href="${safeHref}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:12px;">${safeLabel}</a>
  </p>`;
}

export function buildRegisteredInviteHtml(payload: InvitationEmailPayload): string {
  const link = payload.inviteUrl ?? "#";
  const inviterName = escapeHtml(payload.inviterName);
  const groupName = escapeHtml(payload.groupName);
  return layout(`
    <p style="margin:0 0 12px;">Hi,</p>
    <p style="margin:0 0 12px;"><strong>${inviterName}</strong> has invited you to join <strong>${groupName}</strong>.</p>
    <p style="margin:0;">Open your invitation to review and accept when you are ready.</p>
    ${button(link, "Open Invitation")}
  `);
}

export function buildRegistrationInviteHtml(payload: InvitationEmailPayload): string {
  const link = payload.registerUrl ?? "#";
  const groupName = escapeHtml(payload.groupName);
  return layout(`
    <p style="margin:0 0 12px;">Hi,</p>
    <p style="margin:0 0 12px;">You've been invited to <strong>${groupName}</strong> on ${escapeHtml(BRAND)}.</p>
    <p style="margin:0 0 12px;">Create your account to get started. After you sign up, your invitation will be waiting inside the app.</p>
    ${button(link, "Create Account")}
  `);
}

export function buildRegisteredInviteSubject(groupName: string): string {
  return `You have been invited to join ${groupName}`;
}

export function buildRegistrationInviteSubject(groupName: string): string {
  return `You've been invited to ${BRAND} — join ${groupName}`;
}
