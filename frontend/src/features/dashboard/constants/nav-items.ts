import { ROUTES } from "@/constants/routes";
import type { NavItem } from "@/features/dashboard/types";

export const DASHBOARD_NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", shortLabel: "Home", href: ROUTES.dashboard, icon: "dashboard" },
  { id: "groups", label: "Groups", shortLabel: "Groups", href: ROUTES.groups, icon: "groups" },
  { id: "activity", label: "Activity", shortLabel: "Feed", href: ROUTES.activity, icon: "activity" },
  { id: "profile", label: "Profile", shortLabel: "You", href: ROUTES.profile, icon: "profile" },
];
