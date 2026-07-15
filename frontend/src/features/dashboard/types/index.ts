/** Balance direction for owe/owed cards. */
export type BalanceType = "total" | "owe" | "owed";

export interface DashboardUser {
  name: string;
  greeting: string;
  avatarUrl?: string;
  initials: string;
}

export interface BalanceSummary {
  total: number;
  youOwe: number;
  youAreOwed: number;
}

export interface QuickAction {
  id: string;
  label: string;
  /** Shorter label for viewports below 375px */
  shortLabel: string;
  icon: "group" | "expense" | "settle";
}

export interface NavItem {
  id: string;
  label: string;
  /** Shorter label for narrow bottom nav */
  shortLabel: string;
  href: string;
  icon: "dashboard" | "groups" | "activity" | "profile";
}

export interface GroupPreview {
  id: string;
  name: string;
  icon: string;
  memberCount: number;
  balance: number;
  /** Positive = you are owed, negative = you owe */
  balanceLabel: string;
  lastActivity: string;
}

export interface ActivityItem {
  id: string;
  description: string;
  groupName: string;
  amount?: string;
  timestamp: string;
  type: "expense" | "settlement" | "payment";
  /** ISO sort key — internal use for feed ordering */
  sortAt?: string;
  groupId?: string;
  targetId?: string;
}
