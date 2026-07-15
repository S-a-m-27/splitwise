export interface ProfileUser {
  readonly id: string;
  readonly fullName: string;
  readonly email: string;
  readonly memberSince: string;
  readonly avatarUrl?: string;
  readonly initials: string;
}

export interface ProfileStats {
  readonly totalGroups: number;
  readonly totalExpenses: number;
  readonly totalPaid: number;
  readonly totalOwed: number;
  readonly totalOwedToYou: number;
}

export interface ProfileFormValues {
  readonly fullName: string;
}

export interface PasswordFormValues {
  readonly currentPassword: string;
  readonly newPassword: string;
  readonly confirmPassword: string;
}

export interface AppAboutInfo {
  readonly appName: string;
  readonly appVersion: string;
  readonly buildVersion: string;
  readonly description: string;
}

export type SettingsItemId =
  | "edit-profile"
  | "change-password"
  | "privacy"
  | "about"
  | "logout";

export interface SettingsItemConfig {
  readonly id: SettingsItemId;
  readonly label: string;
  readonly description?: string;
  readonly href?: string;
  readonly destructive?: boolean;
}
