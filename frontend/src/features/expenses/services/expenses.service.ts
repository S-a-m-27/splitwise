import { authService } from "@/features/auth/services/auth.service";
import {
  ExpensesServiceError,
  normalizeExpensesError,
} from "@/features/expenses/services/expenses.errors";
import type { ExpenseDetail, ExpenseListItem } from "@/features/expenses/types";
import type { ExpenseFormValues } from "@/features/expenses/types";
import {
  expenseIdSchema,
  parseExpenseFormValues,
} from "@/features/expenses/validation/expenses.schema";
import {
  mapExpenseDetail,
  mapExpenseListItem,
  type ExpenseDetailRow,
  type ExpenseListRow,
} from "@/features/expenses/utils/map-expense";
import { createClient as createBrowserClient } from "@/lib/supabase/client";

export { getExpensesErrorMessage } from "@/features/expenses/services/expenses.errors";

const EXPENSE_LIST_SELECT = `
  id,
  group_id,
  title,
  amount,
  paid_by,
  paid_by_guest_id,
  notes,
  split_type,
  created_by,
  created_at,
  updated_at,
  groups(id, name, icon),
  payer:profiles!expenses_paid_by_fkey(id, full_name, avatar_url),
  payer_guest:group_guests!expenses_paid_by_guest_id_fkey(id, display_name),
  expense_participants(count)
`;

const EXPENSE_DETAIL_SELECT = `
  id,
  group_id,
  title,
  amount,
  paid_by,
  paid_by_guest_id,
  notes,
  split_type,
  created_by,
  created_at,
  updated_at,
  groups(id, name, icon),
  payer:profiles!expenses_paid_by_fkey(id, full_name, avatar_url),
  payer_guest:group_guests!expenses_paid_by_guest_id_fkey(id, display_name),
  expense_participants(
    id,
    user_id,
    guest_id,
    share_amount,
    profiles(id, full_name, avatar_url),
    group_guests(id, display_name)
  )
`;

async function requireUserId(): Promise<string> {
  const { user, error } = await authService.getCurrentUser();

  if (error || !user) {
    throw new ExpensesServiceError(
      "NO_SESSION",
      "Your session has expired. Please sign in again.",
    );
  }

  return user.id;
}

function throwIfSupabaseError(error: { message: string; code?: string } | null): void {
  if (!error) return;
  const normalized = normalizeExpensesError(error);
  throw new ExpensesServiceError(normalized.code, normalized.message);
}

export const expensesService = {
  async getExpenses(groupId?: string): Promise<ExpenseListItem[]> {
    await requireUserId();
    const supabase = createBrowserClient();

    let query = supabase
      .from("expenses")
      .select(EXPENSE_LIST_SELECT)
      .order("created_at", { ascending: false });

    if (groupId) {
      query = query.eq("group_id", groupId);
    }

    const { data, error } = await query;

    if (error) throwIfSupabaseError(error);

    return ((data ?? []) as ExpenseListRow[]).map((row) => mapExpenseListItem(row));
  },

  async getExpense(expenseId: string): Promise<ExpenseDetail> {
    const userId = await requireUserId();
    const parsedId = expenseIdSchema.safeParse(expenseId);

    if (!parsedId.success) {
      throw new ExpensesServiceError(
        "VALIDATION_ERROR",
        parsedId.error.issues[0]?.message ?? "Invalid expense.",
      );
    }

    const supabase = createBrowserClient();
    const { data, error } = await supabase
      .from("expenses")
      .select(EXPENSE_DETAIL_SELECT)
      .eq("id", parsedId.data)
      .single();

    if (error) throwIfSupabaseError(error);
    if (!data) {
      throw new ExpensesServiceError(
        "NOT_FOUND",
        "Expense not found or you do not have access.",
      );
    }

    return mapExpenseDetail(data as ExpenseDetailRow, userId);
  },

  async createExpense(values: ExpenseFormValues): Promise<ExpenseDetail> {
    await requireUserId();
    const parsed = parseExpenseFormValues(values);

    if (!parsed.success) {
      throw new ExpensesServiceError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Invalid expense data.",
      );
    }

    const supabase = createBrowserClient();
    const { data, error } = await supabase.rpc("create_expense", {
      p_group_id: parsed.data.groupId,
      p_title: parsed.data.title,
      p_amount: parsed.data.amount,
      p_paid_by: parsed.data.paidById,
      p_participant_ids: parsed.data.participantIds,
      p_notes: parsed.data.notes || null,
    });

    if (error) throwIfSupabaseError(error);
    if (!data) {
      throw new ExpensesServiceError("UNKNOWN", "Failed to create expense.");
    }

    return this.getExpense(data.id);
  },

  async updateExpense(
    expenseId: string,
    values: ExpenseFormValues,
  ): Promise<ExpenseDetail> {
    await requireUserId();
    const parsedId = expenseIdSchema.safeParse(expenseId);

    if (!parsedId.success) {
      throw new ExpensesServiceError(
        "VALIDATION_ERROR",
        parsedId.error.issues[0]?.message ?? "Invalid expense.",
      );
    }

    const parsed = parseExpenseFormValues(values);

    if (!parsed.success) {
      throw new ExpensesServiceError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Invalid expense data.",
      );
    }

    const supabase = createBrowserClient();
    const { data, error } = await supabase.rpc("update_expense", {
      p_expense_id: parsedId.data,
      p_title: parsed.data.title,
      p_amount: parsed.data.amount,
      p_paid_by: parsed.data.paidById,
      p_participant_ids: parsed.data.participantIds,
      p_notes: parsed.data.notes || null,
    });

    if (error) throwIfSupabaseError(error);
    if (!data) {
      throw new ExpensesServiceError("UNKNOWN", "Failed to update expense.");
    }

    return this.getExpense(data.id);
  },

  async deleteExpense(expenseId: string): Promise<void> {
    await requireUserId();
    const parsedId = expenseIdSchema.safeParse(expenseId);

    if (!parsedId.success) {
      throw new ExpensesServiceError(
        "VALIDATION_ERROR",
        parsedId.error.issues[0]?.message ?? "Invalid expense.",
      );
    }

    const supabase = createBrowserClient();
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", parsedId.data);

    if (error) throwIfSupabaseError(error);
  },
};
