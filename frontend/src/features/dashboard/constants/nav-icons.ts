import { Activity, Home, User, Users } from "lucide-react";

/** Shared nav icon map — single import site for bottom bar and sidebar. */
export const DASHBOARD_NAV_ICONS = {
  dashboard: Home,
  groups: Users,
  activity: Activity,
  profile: User,
} as const;
