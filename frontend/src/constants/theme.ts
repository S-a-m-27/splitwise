/**
 * PWA / meta theme colors — hex mirrors of the OKLCH tokens in globals.css.
 * Keep in sync when updating the design system palette.
 */
export const THEME_COLORS = {
  /** Primary brand — indigo-violet (light mode buttons, PWA chrome) */
  primary: "#6366F1",
  /** Brighter primary for dark-mode status bar / splash */
  primaryDark: "#818CF8",
  /** App canvas background (light) */
  background: "#F9F9FB",
  /** App canvas background (dark) */
  backgroundDark: "#1A1825",
} as const;
