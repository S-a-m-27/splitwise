import { getInitials } from "@/features/dashboard/utils/get-initials";
import type { GroupExpense } from "@/features/groups/types";
import type {
  ExpenseDetail,
  ExpenseListItem,
  ExpenseParticipantShare,
} from "@/features/expenses/types";
import { formatExpenseAmount } from "@/features/expenses/utils/format-expense-amount";
import type { ExpenseRow, ExpenseSplitType } from "@/types/database.types";

interface ExpenseGroupJoin {
  id: string;
  name: string;
  icon: string;
}

interface ExpenseProfileJoin {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

interface ExpenseGuestJoin {
  id: string;
  display_name: string;
}

interface ExpenseParticipantRow {
  id: string;
  user_id: string | null;
  guest_id: string | null;
  share_amount: number;
  profiles: ExpenseProfileJoin | null;
  group_guests: ExpenseGuestJoin | null;
}

interface ExpenseListRow extends ExpenseRow {
  groups: ExpenseGroupJoin | null;
  payer: ExpenseProfileJoin | null;
  payer_guest: ExpenseGuestJoin | null;
  expense_participants: { count: number }[];
}

interface ExpenseDetailRow extends ExpenseRow {
  groups: ExpenseGroupJoin | null;
  payer: ExpenseProfileJoin | null;
  payer_guest: ExpenseGuestJoin | null;
  expense_participants: ExpenseParticipantRow[];
}

function resolveParticipantId(row: ExpenseParticipantRow): string {
  return row.user_id ?? row.guest_id ?? "";
}

function resolvePayerId(row: Pick<ExpenseRow, "paid_by" | "paid_by_guest_id">): string {
  return row.paid_by ?? row.paid_by_guest_id ?? "";
}

function resolveParticipantName(row: ExpenseParticipantRow): string {
  if (row.user_id) {
    return row.profiles?.full_name?.trim() || "Unknown member";
  }
  return row.group_guests?.display_name?.trim() || "Guest";
}

function formatExpenseDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatExpenseCreatedAt(iso: string): string {
  const date = new Date(iso);
  const datePart = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${datePart} · ${timePart}`;
}

function buildSplitSummary(
  amount: number,
  participantCount: number,
  splitType: ExpenseSplitType,
): string {
  if (participantCount <= 0) return "No split";
  const each = amount / participantCount;
  const label =
    splitType === "equal"
      ? `${formatExpenseAmount(each)} each · ${participantCount} ${participantCount === 1 ? "person" : "people"}`
      : `Split ${participantCount} ways`;
  return label;
}

function mapParticipantShare(
  row: ExpenseParticipantRow,
  payerId: string,
  currentUserId: string,
): ExpenseParticipantShare {
  const participantId = resolveParticipantId(row);
  const name = resolveParticipantName(row);
  const isGuest = !row.user_id && !!row.guest_id;

  return {
    id: participantId,
    name,
    initials: getInitials(name),
    avatarUrl: row.profiles?.avatar_url ?? undefined,
    isCurrentUser: row.user_id === currentUserId,
    isGuest,
    perPersonAmount: Number(row.share_amount),
    isPayer: participantId === payerId,
  };
}

export function mapExpenseListItem(row: ExpenseListRow): ExpenseListItem {
  const participantCount = row.expense_participants[0]?.count ?? 0;
  const amount = Number(row.amount);
  const payerName =
    row.payer?.full_name?.trim() ||
    row.payer_guest?.display_name?.trim() ||
    "Unknown";
  const payerId = resolvePayerId(row);

  return {
    id: row.id,
    title: row.title,
    amount,
    paidBy: payerName,
    paidById: payerId,
    date: formatExpenseDate(row.created_at),
    createdAt: formatExpenseCreatedAt(row.created_at),
    createdAtIso: row.created_at,
    groupName: row.groups?.name ?? "Unknown group",
    groupId: row.group_id,
    splitType: row.split_type,
    splitSummary: buildSplitSummary(amount, participantCount, row.split_type),
    participantCount,
    notes: row.notes ?? undefined,
  };
}

export function mapExpenseDetail(
  row: ExpenseDetailRow,
  currentUserId: string,
): ExpenseDetail {
  const listItem = mapExpenseListItem({
    ...row,
    expense_participants: [{ count: row.expense_participants.length }],
  });

  const payerId = resolvePayerId(row);

  const participants = row.expense_participants.map((participant) =>
    mapParticipantShare(participant, payerId, currentUserId),
  );

  const perPersonAmount =
    participants.length > 0
      ? participants.reduce((sum, p) => sum + p.perPersonAmount, 0) / participants.length
      : 0;

  return {
    ...listItem,
    participants,
    perPersonAmount,
  };
}

export function mapExpenseToGroupExpense(row: ExpenseListItem): GroupExpense {
  return {
    id: row.id,
    title: row.title,
    paidBy: row.paidBy,
    amount: row.amount,
    date: row.date,
    splitCount: row.participantCount,
  };
}

export function expenseToFormValues(expense: ExpenseDetail): {
  title: string;
  amount: string;
  paidById: string;
  participantIds: string[];
  splitType: "equal";
  splitValues: Record<string, string>;
  notes: string;
  groupId: string;
} {
  return {
    title: expense.title,
    amount: String(expense.amount),
    paidById: expense.paidById,
    participantIds: expense.participants.map((p) => p.id),
    splitType: "equal",
    splitValues: Object.fromEntries(
      expense.participants.map((p) => [p.id, String(p.perPersonAmount)]),
    ),
    notes: expense.notes ?? "",
    groupId: expense.groupId,
  };
}

export type { ExpenseListRow, ExpenseDetailRow };
