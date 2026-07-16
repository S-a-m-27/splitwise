import type { InvitationEmailPayload } from "./types.ts";

const BRAND = Deno.env.get("APP_NAME") ?? "Splitwise";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function subjectPart(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function layout(preheader: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(BRAND)}</title>
</head>
<body style="margin:0;padding:0;background:#f6f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#172033;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f7fb;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border:1px solid #e7e9f2;border-radius:18px;overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 10px;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="width:38px;height:38px;border-radius:12px;background:#6558f5;color:#ffffff;text-align:center;font-size:19px;font-weight:800;">S</td>
                  <td style="padding-left:11px;font-size:21px;font-weight:750;color:#172033;">${escapeHtml(BRAND)}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 28px 30px;color:#465069;font-size:15px;line-height:1.65;">
              ${content}
            </td>
          </tr>
        </table>
        <p style="max-width:480px;margin:18px auto 0;font-size:12px;line-height:1.5;color:#8b93a7;text-align:center;">
          You received this email because someone invited you to a group on ${escapeHtml(BRAND)}.
          If you were not expecting it, you can safely ignore it.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function button(href: string, label: string): string {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0 18px;">
    <tr>
      <td style="border-radius:11px;background:#6558f5;">
        <a href="${safeHref}" style="display:inline-block;padding:12px 20px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;">${safeLabel}</a>
      </td>
    </tr>
  </table>`;
}

function invitationDetails(groupName: string, inviterName: string): string {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0 4px;background:#f7f7fc;border:1px solid #e8e7fb;border-radius:12px;">
    <tr>
      <td style="padding:14px 16px;">
        <div style="font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#777f94;">Group invitation</div>
        <div style="margin-top:4px;font-size:17px;font-weight:700;color:#20283b;">${groupName}</div>
        <div style="margin-top:2px;font-size:13px;color:#777f94;">Invited by ${inviterName}</div>
      </td>
    </tr>
  </table>`;
}

function fallbackLink(href: string): string {
  const safeHref = escapeHtml(href);
  return `<p style="margin:0;font-size:12px;line-height:1.55;color:#8b93a7;">
    If the button does not work, copy and paste this link into your browser:<br />
    <a href="${safeHref}" style="color:#6558f5;word-break:break-all;">${safeHref}</a>
  </p>`;
}

export function buildRegisteredInviteHtml(
  payload: InvitationEmailPayload,
): string {
  const link = payload.inviteUrl ?? "#";
  const inviterName = escapeHtml(payload.inviterName);
  const groupName = escapeHtml(payload.groupName);
  return layout(
    `${payload.inviterName} invited you to ${payload.groupName}`,
    `
    <h1 style="margin:0 0 10px;font-size:24px;line-height:1.3;color:#172033;">You have been invited</h1>
    <p style="margin:0;">Hi,</p>
    <p style="margin:10px 0 0;"><strong style="color:#20283b;">${inviterName}</strong> invited you to join a group on ${escapeHtml(BRAND)}.</p>
    ${invitationDetails(groupName, inviterName)}
    <p style="margin:16px 0 0;">Open the invitation to review the group and choose whether to join.</p>
    ${button(link, "Open invitation")}
    ${fallbackLink(link)}
  `,
  );
}

export function buildRegistrationInviteHtml(
  payload: InvitationEmailPayload,
): string {
  const link = payload.registerUrl ?? "#";
  const inviterName = escapeHtml(payload.inviterName);
  const groupName = escapeHtml(payload.groupName);
  return layout(
    `${payload.inviterName} invited you to ${payload.groupName}`,
    `
    <h1 style="margin:0 0 10px;font-size:24px;line-height:1.3;color:#172033;">Join your group on ${escapeHtml(BRAND)}</h1>
    <p style="margin:0;">Hi,</p>
    <p style="margin:10px 0 0;"><strong style="color:#20283b;">${inviterName}</strong> invited you to join a group on ${escapeHtml(BRAND)}.</p>
    ${invitationDetails(groupName, inviterName)}
    <p style="margin:16px 0 0;">Create your account with this email address. Your invitation will be ready when you sign in.</p>
    ${button(link, "Create account and view invitation")}
    ${fallbackLink(link)}
  `,
  );
}

export function buildRegisteredInviteText(
  payload: InvitationEmailPayload,
): string {
  return `Hi,

${payload.inviterName} invited you to join ${payload.groupName} on ${BRAND}.

Open the invitation:
${payload.inviteUrl ?? ""}

If you were not expecting this invitation, you can safely ignore this email.

— ${BRAND}`;
}

export function buildRegistrationInviteText(
  payload: InvitationEmailPayload,
): string {
  return `Hi,

${payload.inviterName} invited you to join ${payload.groupName} on ${BRAND}.

Create your account with this email address, then view your invitation:
${payload.registerUrl ?? ""}

If you were not expecting this invitation, you can safely ignore this email.

— ${BRAND}`;
}

export function buildRegisteredInviteSubject(
  payload: InvitationEmailPayload,
): string {
  return `${subjectPart(payload.inviterName)} invited you to ${subjectPart(payload.groupName)}`;
}

export function buildRegistrationInviteSubject(
  payload: InvitationEmailPayload,
): string {
  return `${subjectPart(payload.inviterName)} invited you to ${subjectPart(payload.groupName)}`;
}
