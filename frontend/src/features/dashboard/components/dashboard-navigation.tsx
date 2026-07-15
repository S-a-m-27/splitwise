"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { DASHBOARD_NAV_ITEMS } from "@/features/dashboard/constants/nav-items";
import { DASHBOARD_NAV_ICONS } from "@/features/dashboard/constants/nav-icons";
import { useDashboardNavUser } from "@/features/dashboard/hooks/use-dashboard";
import { isNavActive } from "@/features/dashboard/utils/is-nav-active";
import { MOBILE_COLUMN_CLASS } from "@/features/dashboard/constants/layout";
import { cn } from "@/lib/utils";

const DesktopSidebarPanel = dynamic(
  () =>
    import("@/features/dashboard/components/desktop-sidebar-panel").then(
      (mod) => mod.DesktopSidebarPanel,
    ),
  { ssr: false },
);

/** Single client nav boundary — one pathname subscription for all dashboard routes. */
export function DashboardNavigation() {
  const pathname = usePathname();
  const user = useDashboardNavUser();
  const items = DASHBOARD_NAV_ITEMS;

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
            "flex h-[3.75rem] max-w-none items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)] min-[375px]:h-16 min-[375px]:px-2",
          )}
        >
          {items.map((item) => {
            const Icon = DASHBOARD_NAV_ICONS[item.icon];
            const active = isNavActive(pathname, item.href);

            return (
              <li key={item.id} className="flex min-w-0 flex-1">
                <Link
                  href={item.href}
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
                  <Icon className="size-[1.125rem] shrink-0 min-[375px]:size-5" aria-hidden="true" />
                  <span className="w-full truncate text-center leading-none">
                    <span className="min-[375px]:hidden">{item.shortLabel}</span>
                    <span className="hidden min-[375px]:inline">{item.label}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
