import { roundDollarsToCents } from "@/features/balances/engine/rounding";
import type { SettlementInput } from "@/features/balances/engine/types";
import type { SettlementRow } from "@/types/database.types";

function resolveParticipantId(
  userId: string | null,
  guestId: string | null,
): string {
  const participantId = userId ?? guestId;
  if (!participantId) {
    throw new Error("Settlement row is missing payer/receiver participant id.");
  }
  return participantId;
}

export function mapSettlementRowToInput(row: SettlementRow): SettlementInput {
  return {
    id: row.id,
    groupId: row.group_id,
    fromUserId: resolveParticipantId(row.from_user_id, row.from_guest_id),
    toUserId: resolveParticipantId(row.to_user_id, row.to_guest_id),
    amountCents: roundDollarsToCents(Number(row.amount)),
  };
}

export function mapSettlementRowsToInput(rows: readonly SettlementRow[]): SettlementInput[] {
  return rows.map(mapSettlementRowToInput);
}
