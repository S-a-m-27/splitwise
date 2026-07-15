import {
  profileAboutRoute,
  profileChangePasswordRoute,
  profileEditRoute,
} from "@/constants/routes";
import type { SettingsItemConfig } from "@/features/profile/types";

export const PROFILE_SETTINGS_ITEMS: readonly SettingsItemConfig[] = [
  {
    id: "edit-profile",
    label: "Edit Profile",
    description: "Update your name and photo",
    href: profileEditRoute(),
  },
  {
    id: "change-password",
    label: "Change Password",
    description: "Keep your account secure",
    href: profileChangePasswordRoute(),
  },
  {
    id: "preferences",
    label: "App Preferences",
    description: "Notifications, currency, and display",
  },
  {
    id: "privacy",
    label: "Privacy",
    description: "Data and visibility controls",
  },
  {
    id: "about",
    label: "About",
    description: "Version, terms, and policies",
    href: profileAboutRoute(),
  },
  {
    id: "logout",
    label: "Log out",
    description: "Sign out of your account",
    destructive: true,
  },
] as const;
