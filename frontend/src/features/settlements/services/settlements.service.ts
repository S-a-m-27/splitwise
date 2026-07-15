import { authService } from "@/features/auth/services/auth.service";
import { BalanceEngine } from "@/features/balances/engine/balance-engine";
import { mapExpenseRowsToInput } from "@/features/balances/adapters/map-expense-input";
import type { BalanceExpenseRow } from "@/features/balances/adapters/map-expense-input";
import { mapSettlementRowsToInput } from "@/features/settlements/adapters/map-settlement-input";
import {
  SettlementsServiceError,
  getSettlementsErrorMessage,
} from "@/features/settlements/services/settlements.errors";
import type {
  CreateSettlementInput,
  OutstandingDebt,
  SettlementListItem,
} from "@/features/settlements/types";
import { buildDebtBreakdown } from "@/features/settlements/utils/build-debt-breakdown";
import { formatCurrency } from "@/features/dashboard/utils/format-currency";
import { formatMoney } from "@/lib/currency";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import type { SettlementRow } from "@/types/database.types";

export { getSettlementsErrorMessage };

const SETTLEMENT_LIST_SELECT = `
  id,
  group_id,
  from_user_id,
  to_user_id,
  amount,
  notes,
  created_at,
  groups(id, name, icon),
  from_user:profiles!settlements_from_user_id_fkey(id, full_name),
  to_user:profiles!settlements_to_user_id_fkey(id, full_name)
`;

interface SettlementListRow extends SettlementRow {
  groups: { id: string; name: string; icon: string } | null;
  from_user: { id: string; full_name: string } | null;
  to_user: { id: string; full_name: string } | null;
}

interface MemberNameRow {
  user_id: string;
  profiles: { full_name: string } | null;
}

interface GuestNameRow {
  id: string;
  display_name: string;
}

async function requireUserId(): Promise<string> {
  const { user, error } = await authService.getCurrentUser();
  if (error || !user) {
    throw new SettlementsServiceError(
      "NO_SESSION",
      "Your session has expired. Please sign in again.",
    );
  }
  return user.id;
}

function mapSettlementListItem(row: SettlementListRow): SettlementListItem {
  const amount = Number(row.amount);
  return {
    id: row.id,
    groupId: row.group_id,
    groupName: row.groups?.name ?? "Unknown group",
    groupIcon: row.groups?.icon ?? "👥",
    fromUserId: row.from_user_id,
    fromUserName: row.from_user?.full_name?.trim() || "Someone",
    toUserId: row.to_user_id,
    toUserName: row.to_user?.full_name?.trim() || "Someone",
    amount,
    amountLabel: formatCurrency(amount),
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  };
}

async function fetchParticipantNames(): Promise<Map<string, string>> {
  const supabase = createBrowserClient();
  const names = new Map<string, string>();

  const [membersResult, guestsResult] = await Promise.all([
    supabase.from("group_members").select("user_id, profiles(full_name)"),
    supabase.from("group_guests").select("id, display_name"),
  ]);

  for (const row of (membersResult.data ?? []) as MemberNameRow[]) {
    names.set(row.user_id, row.profiles?.full_name?.trim() || "Member");
  }

  for (const row of (guestsResult.data ?? []) as GuestNameRow[]) {
    names.set(row.id, row.display_name.trim());
  }

  return names;
}

export const settlementsService = {
  async getSettlements(groupId?: string): Promise<SettlementListItem[]> {
    await requireUserId();
    const supabase = createBrowserClient();

    let query = supabase
      .from("settlements")
      .select(SETTLEMENT_LIST_SELECT)
      .order("created_at", { ascending: false });

    if (groupId) {
      query = query.eq("group_id", groupId);
    }

    const { data, error } = await query;
    if (error) {
      throw new SettlementsServiceError("UNKNOWN", error.message);
    }

    return ((data ?? []) as SettlementListRow[]).map(mapSettlementListItem);
  },

  async getOutstandingDebts(userId: string): Promise<OutstandingDebt[]> {
    await requireUserId();
    const supabase = createBrowserClient();

    const [expensesResult, settlementsResult, names] = await Promise.all([
      supabase
        .from("expenses")
        .select(
          "id, group_id, title, created_at, amount, paid_by, paid_by_guest_id, split_type, expense_participants(user_id, guest_id)",
        ),
      supabase
        .from("settlements")
        .select("id, group_id, from_user_id, to_user_id, amount, notes, created_at"),
      fetchParticipantNames(),
    ]);

    if (expensesResult.error) {
      throw new SettlementsServiceError("UNKNOWN", expensesResult.error.message);
    }
    if (settlementsResult.error) {
      throw new SettlementsServiceError("UNKNOWN", settlementsResult.error.message);
    }

    const groupsResult = await supabase.from("groups").select("id, name, icon");
    const groupMap = new Map(
      (groupsResult.data ?? []).map((g) => [g.id, { name: g.name, icon: g.icon }]),
    );

    const result = BalanceEngine.recalculate({
      expenses: mapExpenseRowsToInput((expensesResult.data ?? []) as BalanceExpenseRow[]),
      settlements: mapSettlementRowsToInput((settlementsResult.data ?? []) as SettlementRow[]),
      currentUserId: userId,
    });

    const expenseMeta = new Map(
      (expensesResult.data ?? []).map((row) => [
        row.id,
        { title: row.title, createdAt: row.created_at },
      ]),
    );

    const settlementMeta = new Map(
      (settlementsResult.data ?? []).map((row) => [
        row.id,
        { notes: row.notes ?? undefined, createdAt: row.created_at },
      ]),
    );

    const settlementInputs = mapSettlementRowsToInput(
      (settlementsResult.data ?? []) as SettlementRow[],
    );

    const debts: OutstandingDebt[] = [];

    for (const [groupId, groupResult] of result.groupBalances) {
      const groupMeta = groupMap.get(groupId);
      const groupName = groupMeta?.name ?? "Unknown group";
      const groupIcon = groupMeta?.icon ?? "👥";

      for (const rel of groupResult.simplifiedRelationships) {
        const amount = rel.amountCents / 100;
        const fromName = names.get(rel.fromUserId) ?? "Someone";
        const toName = names.get(rel.toUserId) ?? "Someone";

        if (rel.fromUserId === userId) {
          const breakdown = buildDebtBreakdown({
            groupId,
            fromUserId: rel.fromUserId,
            toUserId: rel.toUserId,
            expenseResults: result.expenseResults,
            settlements: settlementInputs,
            expenseMeta,
            settlementMeta,
            names,
            formatMoney,
          });

          debts.push({
            id: `${groupId}-${rel.fromUserId}-${rel.toUserId}`,
            groupId,
            groupName,
            groupIcon,
            fromUserId: rel.fromUserId,
            fromUserName: fromName,
            toUserId: rel.toUserId,
            toUserName: toName,
            amount,
            amountLabel: formatCurrency(amount),
            direction: "you_owe",
            breakdown,
          });
        } else if (rel.toUserId === userId) {
          const breakdown = buildDebtBreakdown({
            groupId,
            fromUserId: rel.fromUserId,
            toUserId: rel.toUserId,
            expenseResults: result.expenseResults,
            settlements: settlementInputs,
            expenseMeta,
            settlementMeta,
            names,
            formatMoney,
          });

          debts.push({
            id: `${groupId}-${rel.fromUserId}-${rel.toUserId}`,
            groupId,
            groupName,
            groupIcon,
            fromUserId: rel.fromUserId,
            fromUserName: fromName,
            toUserId: rel.toUserId,
            toUserName: toName,
            amount,
            amountLabel: formatCurrency(amount),
            direction: "owed_to_you",
            breakdown,
          });
        }
      }
    }

    return debts.sort((a, b) => b.amount - a.amount);
  },

  async createSettlement(input: CreateSettlementInput): Promise<SettlementListItem> {
    await requireUserId();
    const supabase = createBrowserClient();

    if (input.amount <= 0) {
      throw new SettlementsServiceError("VALIDATION_ERROR", "Amount must be greater than zero.");
    }

    const { data, error } = await supabase.rpc("create_settlement", {
      p_group_id: input.groupId,
      p_from_user_id: input.fromUserId,
      p_to_user_id: input.toUserId,
      p_amount: input.amount,
      p_notes: input.notes || null,
    });

    if (error) {
      throw new SettlementsServiceError("UNKNOWN", error.message);
    }
    if (!data) {
      throw new SettlementsServiceError("UNKNOWN", "Failed to record settlement.");
    }

    const list = await this.getSettlements(input.groupId);
    const created = list.find((item) => item.id === data.id);
    if (!created) {
      throw new SettlementsServiceError("UNKNOWN", "Settlement saved but could not be loaded.");
    }

    return created;
  },
};
