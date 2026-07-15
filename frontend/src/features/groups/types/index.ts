import type { GroupMemberRole } from "@/types/database.types";

export type GroupType = "trip" | "home" | "couple" | "friends" | "other";

export type GroupActivityType =
  | "expense"
  | "member_joined"
  | "settlement"
  | "group_updated";

export interface GroupListItem {
  id: string;
  name: string;
  icon: string;
  type: GroupType;
  description?: string;
  memberCount: number;
  /** Positive = you are owed, negative = you owe */
  balance: number;
  lastActivity: string;
}

export interface GroupMember {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string;
  role: GroupMemberRole;
  /** Positive = member owes you, negative = you owe member */
  balance: number;
  isCurrentUser?: boolean;
  /** Name-only guest — not a registered app user */
  isGuest?: boolean;
}

export interface GroupExpense {
  id: string;
  title: string;
  paidBy: string;
  amount: number;
  date: string;
  splitCount: number;
}

export interface GroupActivity {
  id: string;
  type: GroupActivityType;
  description: string;
  timestamp: string;
  amount?: string;
  /** Expense or settlement id for navigation */
  targetId?: string;
}

export interface GroupBalanceSummary {
  total: number;
  youOwe: number;
  youAreOwed: number;
}

export interface GroupDetail extends GroupListItem {
  members: GroupMember[];
  expenses: GroupExpense[];
  activities: GroupActivity[];
  balanceSummary: GroupBalanceSummary;
  inviteLink: string;
  currentUserRole: GroupMemberRole;
}

export interface CreateGroupFormValues {
  name: string;
  type: GroupType;
  icon: string;
  description: string;
}

export interface EditGroupFormValues {
  name: string;
  icon: string;
  description: string;
}
