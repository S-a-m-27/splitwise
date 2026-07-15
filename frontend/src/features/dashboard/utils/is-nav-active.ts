/** Returns true when pathname matches a nav href (exact or nested). */
export function isNavActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
