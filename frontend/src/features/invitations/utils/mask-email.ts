/** Masks an email for display, e.g. sohaib@example.com → s***@example.com */
export function maskEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  const atIndex = normalized.indexOf("@");
  if (atIndex <= 0) return normalized;

  const local = normalized.slice(0, atIndex);
  const domain = normalized.slice(atIndex);
  const visible = local.slice(0, 1);
  return `${visible}***${domain}`;
}
