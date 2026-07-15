import { authService } from "@/features/auth/services/auth.service";
import {
  mapBalanceEngineResultToSnapshot,
  type BalanceSnapshot,
} from "@/features/balances/adapters/map-balance-ui";
import {
  mapExpenseRowsToInput,
  type BalanceExpenseRow,
} from "@/features/balances/adapters/map-expense-input";
import { BalanceEngine } from "@/features/balances/engine/balance-engine";
import type { BalanceEngineInput } from "@/features/balances/engine/types";
import {
  BalancesServiceError,
  getBalancesErrorMessage,
} from "@/features/balances/services/balances.errors";
import { mapSettlementRowsToInput } from "@/features/settlements/adapters/map-settlement-input";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import type { SettlementRow } from "@/types/database.types";

export { getBalancesErrorMessage };

const BALANCE_EXPENSE_SELECT = `
  id,
  group_id,
  amount,
  paid_by,
  paid_by_guest_id,
  split_type,
  expense_participants(user_id, guest_id)
`;

const GROUP_MEMBERS_SELECT = `
  group_id,
  user_id
`;

const GROUP_GUESTS_SELECT = `
  group_id,
  id
`;

const SETTLEMENTS_SELECT = `
  id,
  group_id,
  from_user_id,
  from_guest_id,
  to_user_id,
  to_guest_id,
  amount
`;

async function requireUserId(): Promise<string> {
  const { user, error } = await authService.getCurrentUser();

  if (error || !user) {
    throw new BalancesServiceError(
      "NO_SESSION",
      "Your session has expired. Please sign in again.",
    );
  }

  return user.id;
}

/**
 * Fetches all accessible expenses with participant IDs for balance calculation.
 * RLS ensures the user only sees expenses from their groups.
 */
async function fetchBalanceExpenses(): Promise<BalanceExpenseRow[]> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("expenses")
    .select(BALANCE_EXPENSE_SELECT)
    .order("created_at", { ascending: true });

  if (error) {
    throw new BalancesServiceError("UNKNOWN", error.message);
  }

  return (data ?? []) as BalanceExpenseRow[];
}

async function fetchGroupParticipantIds(): Promise<Record<string, string[]>> {
  const supabase = createBrowserClient();

  const [membersResult, guestsResult] = await Promise.all([
    supabase.from("group_members").select(GROUP_MEMBERS_SELECT),
    supabase.from("group_guests").select(GROUP_GUESTS_SELECT),
  ]);

  if (membersResult.error) {
    throw new BalancesServiceError("UNKNOWN", membersResult.error.message);
  }
  if (guestsResult.error) {
    throw new BalancesServiceError("UNKNOWN", guestsResult.error.message);
  }

  const participantIds: Record<string, string[]> = {};

  for (const row of membersResult.data ?? []) {
    const groupId = row.group_id;
    if (!participantIds[groupId]) {
      participantIds[groupId] = [];
    }
    participantIds[groupId].push(row.user_id);
  }

  for (const row of guestsResult.data ?? []) {
    const groupId = row.group_id;
    if (!participantIds[groupId]) {
      participantIds[groupId] = [];
    }
    participantIds[groupId].push(row.id);
  }

  return participantIds;
}

async function fetchSettlements(): Promise<SettlementRow[]> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("settlements")
    .select(SETTLEMENTS_SELECT)
    .order("created_at", { ascending: true });

  if (error) {
    throw new BalancesServiceError("UNKNOWN", error.message);
  }

  return (data ?? []) as SettlementRow[];
}

export const balancesService = {
  /**
   * Computes the full balance snapshot for the authenticated user.
   * This is the single source of truth for all balance UI in the app.
   */
  async getBalanceSnapshot(userId: string): Promise<BalanceSnapshot> {
    const sessionUserId = await requireUserId();

    if (sessionUserId !== userId) {
      throw new BalancesServiceError(
        "NO_SESSION",
        "Your session has expired. Please sign in again.",
      );
    }

    const [expenseRows, groupParticipantIds, settlementRows] = await Promise.all([
      fetchBalanceExpenses(),
      fetchGroupParticipantIds(),
      fetchSettlements(),
    ]);

    const input: BalanceEngineInput = {
      expenses: mapExpenseRowsToInput(expenseRows),
      settlements: mapSettlementRowsToInput(settlementRows),
      currentUserId: userId,
    };

    const result = BalanceEngine.recalculate(input);
    return mapBalanceEngineResultToSnapshot(result, userId, groupParticipantIds);
  },
};
