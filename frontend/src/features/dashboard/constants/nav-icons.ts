import { Home, MessageSquare, Plus, User, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Shared nav icon map — single import site for bottom bar and sidebar. */
export const DASHBOARD_NAV_ICONS = {
  dashboard: Home,
  groups: Users,
  messages: MessageSquare,
  activity: MessageSquare,
  profile: User,
  quickAdd: Plus,
} as const;

export function resolveNavIcon(icon: keyof typeof DASHBOARD_NAV_ICONS): LucideIcon {
  return DASHBOARD_NAV_ICONS[icon] ?? MessageSquare;
}
