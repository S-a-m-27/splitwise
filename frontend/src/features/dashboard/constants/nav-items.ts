import { ROUTES } from "@/constants/routes";
import type { NavItem } from "@/features/dashboard/types";

/** Literal paths — avoids any module-init race with ROUTES during dev HMR. */
const NAV_PATHS = {
  dashboard: "/dashboard",
  groups: "/groups",
  messages: "/chat",
  profile: "/profile",
} as const;

export const DASHBOARD_NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    shortLabel: "Home",
    href: NAV_PATHS.dashboard,
    icon: "dashboard",
  },
  {
    id: "groups",
    label: "Groups",
    shortLabel: "Groups",
    href: NAV_PATHS.groups,
    icon: "groups",
  },
  {
    id: "messages",
    label: "Messages",
    shortLabel: "Messages",
    href: NAV_PATHS.messages,
    icon: "messages",
  },
  {
    id: "profile",
    label: "Profile",
    shortLabel: "You",
    href: NAV_PATHS.profile,
    icon: "profile",
  },
];

const NAV_HREF_FALLBACKS: Record<string, string> = {
  dashboard: NAV_PATHS.dashboard,
  groups: NAV_PATHS.groups,
  messages: NAV_PATHS.messages,
  profile: NAV_PATHS.profile,
};

export function resolveNavHref(item: Pick<NavItem, "id" | "href">): string {
  const href = item.href ?? NAV_HREF_FALLBACKS[item.id];
  if (typeof href === "string" && href.length > 0) {
    return href;
  }
  return ROUTES.dashboard;
}
