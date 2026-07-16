"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { ROUTES } from "@/constants/routes";
import { DASHBOARD_NAV_ITEMS, resolveNavHref } from "@/features/dashboard/constants/nav-items";
import { DASHBOARD_NAV_ICONS, resolveNavIcon } from "@/features/dashboard/constants/nav-icons";
import { useDashboardNavUser } from "@/features/dashboard/hooks/use-dashboard";
import { isNavActive } from "@/features/dashboard/utils/is-nav-active";
import { MOBILE_COLUMN_CLASS } from "@/features/dashboard/constants/layout";
import { useUnreadCount } from "@/features/chat/hooks/use-unread-count";
import { cn } from "@/lib/utils";

const DesktopSidebarPanel = dynamic(
  () =>
    import("@/features/dashboard/components/desktop-sidebar-panel").then(
      (mod) => mod.DesktopSidebarPanel,
    ),
  { ssr: false },
);

const LEFT_NAV_IDS = new Set(["dashboard", "groups"]);
const RIGHT_NAV_IDS = new Set(["messages", "profile"]);

/** Single client nav boundary — one pathname subscription for all dashboard routes. */
export function DashboardNavigation() {
  const pathname = usePathname();
  const user = useDashboardNavUser();
  const unreadCount = useUnreadCount();
  const items = DASHBOARD_NAV_ITEMS;

  const leftItems = items.filter((item) => LEFT_NAV_IDS.has(item.id));
  const rightItems = items.filter((item) => RIGHT_NAV_IDS.has(item.id));

  return (
    <>
      <DesktopSidebarPanel pathname={pathname} items={items} user={user ?? null} />

      <nav
        aria-label="Main navigation"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card xl:hidden"
      >
        <ul
          className={cn(
            MOBILE_COLUMN_CLASS,
            "flex h-[3.75rem] max-w-none items-stretch justify-between px-1 pb-[env(safe-area-inset-bottom)] min-[375px]:h-16 min-[375px]:px-2",
          )}
        >
          {leftItems.map((item) => (
            <NavLink key={item.id} item={item} pathname={pathname} />
          ))}

          <li className="flex shrink-0 items-center justify-center px-1">
            <Link
              href={ROUTES.expenseNew}
              aria-label="Quick add expense"
              className={cn(
                "flex size-12 -translate-y-3 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg",
                "transition-transform active:scale-90 min-[375px]:size-[3.25rem]",
                "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              )}
            >
              <DASHBOARD_NAV_ICONS.quickAdd
                className="size-5 min-[375px]:size-6"
                strokeWidth={2.5}
                aria-hidden="true"
              />
            </Link>
          </li>

          {rightItems.map((item) => (
            <NavLink
              key={item.id}
              item={item}
              pathname={pathname}
              badgeCount={item.id === "messages" ? unreadCount : 0}
            />
          ))}
        </ul>
      </nav>
    </>
  );
}

interface NavLinkProps {
  item: (typeof DASHBOARD_NAV_ITEMS)[number];
  pathname: string;
  badgeCount?: number;
}

function NavLink({ item, pathname, badgeCount = 0 }: NavLinkProps) {
  const href = resolveNavHref(item);
  const Icon = resolveNavIcon(item.icon);
  const active = isNavActive(pathname, href);

  if (!href) {
    return null;
  }

  return (
    <li className="flex min-w-0 flex-1 max-w-[4.5rem] min-[375px]:max-w-none">
      <Link
        href={href}
        prefetch
        className={cn(
          "relative flex min-h-11 w-full min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-1",
          "text-[9px] font-semibold active:bg-muted/80 min-[375px]:px-1 min-[375px]:text-[10px]",
          active ? "text-primary" : "text-muted-foreground",
        )}
        aria-current={active ? "page" : undefined}
      >
        {active && (
          <span
            className="absolute inset-x-1 top-0 h-0.5 rounded-full bg-primary min-[375px]:inset-x-2"
            aria-hidden="true"
          />
        )}
        <span className="relative">
          <Icon className="size-[1.125rem] shrink-0 min-[375px]:size-5" aria-hidden="true" />
          {badgeCount > 0 && (
            <span
              className="absolute -right-2 -top-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white"
              aria-label={`${badgeCount} unread messages`}
            >
              {badgeCount > 9 ? "9+" : badgeCount}
            </span>
          )}
        </span>
        <span className="w-full truncate text-center leading-none">
          <span className="min-[375px]:hidden">{item.shortLabel}</span>
          <span className="hidden min-[375px]:inline">{item.label}</span>
        </span>
      </Link>
    </li>
  );
}
