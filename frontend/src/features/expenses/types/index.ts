export type SplitType = "equal" | "exact" | "percentage" | "shares";

export interface ExpenseParticipant {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string;
  isCurrentUser?: boolean;
  isGuest?: boolean;
}

export interface ExpenseParticipantShare extends ExpenseParticipant {
  perPersonAmount: number;
  isPayer?: boolean;
}

export interface ExpenseListItem {
  id: string;
  title: string;
  amount: number;
  paidBy: string;
  paidById: string;
  date: string;
  createdAt: string;
  /** Raw ISO timestamp for sorting */
  createdAtIso: string;
  groupName: string;
  groupId: string;
  splitType: SplitType;
  splitSummary: string;
  participantCount: number;
  notes?: string;
}

export interface ExpenseDetail extends ExpenseListItem {
  participants: ExpenseParticipantShare[];
  perPersonAmount: number;
}

export interface ExpenseFormValues {
  title: string;
  amount: string;
  paidById: string;
  participantIds: string[];
  splitType: SplitType;
  splitValues: Record<string, string>;
  notes: string;
  groupId: string;
}

export interface MockGroupOption {
  id: string;
  name: string;
  icon: string;
}
