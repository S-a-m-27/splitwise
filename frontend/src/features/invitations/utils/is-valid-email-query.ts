/** Lightweight email shape check for invite search UI (not a full RFC validator). */
export function isValidEmailQuery(query: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query.trim().toLowerCase());
}
