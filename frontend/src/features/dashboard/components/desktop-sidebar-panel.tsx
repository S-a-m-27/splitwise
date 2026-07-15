import Link from "next/link";
import {
  ArrowLeftRight,
  Plus,
  Receipt,
  Sparkles,
} from "lucide-react";
import { APP_CONFIG } from "@/constants/config";
import { ROUTES } from "@/constants/routes";
import { DASHBOARD_NAV_ICONS } from "@/features/dashboard/constants/nav-icons";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { UserAvatar } from "@/features/dashboard/components/user-avatar";
import { isNavActive } from "@/features/dashboard/utils/is-nav-active";
import { META_TEXT_CLASS } from "@/lib/typography";
import type { DashboardUser } from "@/features/dashboard/types";
import type { NavItem } from "@/features/dashboard/types";
import { cn } from "@/lib/utils";

const QUICK_ACTIONS = [
  {
    id: "expense",
    label: "New expense",
    href: ROUTES.expenseNew,
    icon: Plus,
    variant: "primary" as const,
  },
  {
    id: "settle",
    label: "Settle up",
    href: ROUTES.settlements,
    icon: ArrowLeftRight,
    variant: "secondary" as const,
  },
] as const;

interface DesktopSidebarPanelProps {
  pathname: string;
  items: NavItem[];
  user: DashboardUser | null;
}

/** xl sidebar — dynamically imported, outside the mobile critical path. */
export function DesktopSidebarPanel({
  pathname,
  items,
  user,
}: DesktopSidebarPanelProps) {
  return (
    <aside
      aria-label="Sidebar navigation"
      className="sidebar-panel relative hidden w-[17.5rem] shrink-0 flex-col border-r xl:flex"
    >
      {/* Decorative glow */}
      <div
        className="pointer-events-none absolute -top-20 right-0 size-40 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklch, var(--gradient-glow) 35%, transparent) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      {/* Brand header */}
      <div className="relative flex h-[4.75rem] items-center gap-3 border-b border-sidebar-border/80 px-5">
        <Link
          href={ROUTES.dashboard}
          className="group flex min-w-0 flex-1 items-center gap-3 transition-opacity hover:opacity-90"
        >
          <span className="logo-glow relative flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/75 shadow-md shadow-primary/20">
            <Receipt
              className="size-5 text-primary-foreground"
              aria-hidden="true"
            />
            <span
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/25 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
              aria-hidden="true"
            />
          </span>
          <div className="min-w-0">
            <span className="font-heading block truncate text-lg font-bold tracking-tight text-sidebar-foreground">
              {APP_CONFIG.name}
            </span>
            <p className={cn(META_TEXT_CLASS, "truncate")}>Expense sharing</p>
          </div>
        </Link>
      </div>

      {/* Quick actions */}
      <div className="relative space-y-2 px-4 pt-5">
        <p className="px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/80">
          Quick actions
        </p>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            const isPrimary = action.variant === "primary";

            return (
              <Link
                key={action.id}
                href={action.href}
                prefetch
                className={cn(
                  "group flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center text-[11px] font-semibold transition-all duration-200",
                  "hover:-translate-y-0.5 active:translate-y-0",
                  isPrimary
                    ? "btn-premium border-0 text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/25"
                    : "border-sidebar-border/80 bg-card/60 text-foreground hover:border-primary/25 hover:bg-accent/50",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105",
                    isPrimary
                      ? "bg-white/15"
                      : "bg-primary/10 text-primary",
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                {action.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main nav */}
      <nav className="relative flex flex-1 flex-col gap-1 px-4 pt-6">
        <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/80">
          Menu
        </p>
        {items.map((item) => {
          const Icon = DASHBOARD_NAV_ICONS[item.icon];
          const active = isNavActive(pathname, item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              prefetch
              className={cn(
                "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                active
                  ? "sidebar-nav-active text-primary"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                    : "bg-muted/80 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
                )}
              >
                <Icon className="size-[1.125rem]" aria-hidden="true" />
              </span>
              <span className="truncate">{item.label}</span>
              {active && (
                <Sparkles
                  className="ml-auto size-3.5 shrink-0 text-primary/70"
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="relative space-y-2.5 border-t border-sidebar-border/80 p-4">
        {user && (
          <Link
            href={ROUTES.profile}
            className="group flex items-center gap-3 rounded-2xl border border-sidebar-border/70 bg-card/50 p-3 transition-all duration-200 hover:border-primary/20 hover:bg-accent/30 hover:shadow-sm"
          >
            <UserAvatar
              name={user.name}
              avatarUrl={user.avatarUrl}
              initials={user.initials}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {user.name}
              </p>
              <p className={cn(META_TEXT_CLASS, "truncate")}>
                View profile
              </p>
            </div>
          </Link>
        )}
        <LogoutButton
          prominent
          variant="outline"
          label="Log out"
          className="justify-start border-sidebar-border/80 bg-card/50 text-foreground shadow-sm transition-all duration-200 hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive active:scale-[0.99]"
        />
      </div>
    </aside>
  );
}
