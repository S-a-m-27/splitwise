import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { RealtimeChangeContext, RealtimeTable } from "@/lib/realtime/invalidate-queries";

type RowWithGroup = { group_id?: string };
type ExpenseRow = { id?: string; group_id?: string };
type ParticipantRow = { expense_id?: string };

function readGroupId(
  payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
): string | undefined {
  const row = (payload.new ?? payload.old) as RowWithGroup | undefined;
  return row?.group_id;
}

function readExpenseContext(
  payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
): { groupId?: string; expenseId?: string } {
  const row = (payload.new ?? payload.old) as ExpenseRow | undefined;
  return {
    groupId: row?.group_id,
    expenseId: row?.id,
  };
}

function readParticipantContext(
  payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
): { expenseId?: string } {
  const row = (payload.new ?? payload.old) as ParticipantRow | undefined;
  return {
    expenseId: row?.expense_id,
  };
}

export function toRealtimeChangeContext(
  table: RealtimeTable,
  payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
): RealtimeChangeContext {
  switch (table) {
    case "expenses": {
      const { groupId, expenseId } = readExpenseContext(payload);
      return { table, groupId, expenseId };
    }
    case "expense_participants": {
      const { expenseId } = readParticipantContext(payload);
      return { table, expenseId };
    }
    case "settlements":
    case "group_members":
    case "group_guests":
    case "groups":
      return { table, groupId: readGroupId(payload) };
    default:
      return { table };
  }
}
