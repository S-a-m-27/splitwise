import { roundDollarsToCents } from "@/features/balances/engine/rounding";
import type { SettlementInput } from "@/features/balances/engine/types";
import type { SettlementRow } from "@/types/database.types";

export function mapSettlementRowToInput(row: SettlementRow): SettlementInput {
  return {
    id: row.id,
    groupId: row.group_id,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    amountCents: roundDollarsToCents(Number(row.amount)),
  };
}

export function mapSettlementRowsToInput(rows: readonly SettlementRow[]): SettlementInput[] {
  return rows.map(mapSettlementRowToInput);
}
