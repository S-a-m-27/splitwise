import { APP_CONFIG } from "@/constants/config";
import type { AppAboutInfo } from "@/features/profile/types";

export const APP_ABOUT: AppAboutInfo = {
  appName: APP_CONFIG.name,
  appVersion: "0.1.0",
  buildVersion: "2026.07.14",
  description: APP_CONFIG.description,
};
