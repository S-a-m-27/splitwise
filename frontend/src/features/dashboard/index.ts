/**
 * Dashboard feature public API.
 *
 * @module features/dashboard
 */

export { DashboardPage } from "./components/dashboard-page";
export { DashboardShell } from "./components/dashboard-shell";
export { BalanceCard } from "./components/balance-card";
export { BalanceSummaryHero } from "./components/balance-summary-hero";
export { GroupPreviewCard } from "./components/group-preview-card";
export { ActivityCard } from "./components/activity-card";
export { DashboardNavigation } from "./components/dashboard-navigation";
export { SectionTitle } from "./components/section-title";
export { QuickActionCard } from "./components/quick-action-card";
export { DashboardHeader } from "./components/dashboard-header";
export { FloatingActionButton } from "./components/floating-action-button";
export { UserAvatar } from "./components/user-avatar";

export { dashboardService } from "./services/dashboard.service";
export {
  useDashboard,
  useBalanceSummary,
  useGroupsPreview,
  useRecentActivity,
  useDashboardProfile,
  useDashboardNavUser,
} from "./hooks/use-dashboard";

export * from "./types";
