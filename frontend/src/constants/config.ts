import { env } from "@/lib/env";
import { THEME_COLORS } from "@/constants/theme";

export const APP_CONFIG = {
  name: env.NEXT_PUBLIC_APP_NAME,
  url: env.NEXT_PUBLIC_APP_URL,
  description: "Split expenses with friends and family.",
  enablePwa: env.NEXT_PUBLIC_ENABLE_PWA,
  themeColor: THEME_COLORS.primary,
  mobileMinWidth: 320,
  mobileMaxWidth: 430,
} as const;

export const PWA_CONFIG = {
  display: "standalone" as const,
  orientation: "portrait-primary" as const,
  backgroundColor: THEME_COLORS.background,
  themeColor: APP_CONFIG.themeColor,
  themeColorDark: THEME_COLORS.primaryDark,
  startUrl: "/",
  offlineFallback: "/offline",
} as const;
