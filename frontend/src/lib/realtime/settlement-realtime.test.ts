import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { settlementsKeys } from "@/features/settlements/constants/query-keys";
import { groupsKeys } from "@/features/groups/constants/query-keys";
import type { SettlementListItem } from "@/features/settlements/types";
import { reconcileSettlementHistory } from "@/features/settlements/cache/sync-settlement-queries";
import { invalidateQueriesForRealtimeChange } from "@/lib/realtime/invalidate-queries";
import { toRealtimeChangeContext } from "@/lib/realtime/parse-payload";
import {
  clearRealtimeEchoRegistry,
  consumeRealtimeEcho,
  registerRealtimeEcho,
} from "@/lib/realtime/realtime-echo-registry";
import { evaluateRealtimeRecovery } from "@/lib/realtime/realtime-recovery";

function settlement(id: string, createdAt: string): SettlementListItem {
  return {
    id,
    groupId: "group-1",
    groupName: "Trip",
    groupIcon: "T",
    fromUserId: "user-a",
    fromUserName: "Ali",
    toUserId: "user-b",
    toUserName: "Sara",
    amount: 10,
    amountLabel: "$10.00",
    createdAt,
    clientSettlementId: `client-${id}`,
  };
}

describe("settlement realtime synchronization", () => {
  beforeEach(() => {
    clearRealtimeEchoRegistry();
  });

  it("extracts group and client identifiers from settlement payloads", () => {
    const payload = {
      new: {
        group_id: "group-1",
        client_settlement_id: "client-1",
      },
      old: {},
    } as unknown as RealtimePostgresChangesPayload<Record<string, unknown>>;

    expect(toRealtimeChangeContext("settlements", payload)).toEqual({
      table: "settlements",
      groupId: "group-1",
      clientEventId: "client-1",
    });
  });

  it("invalidates outstanding debts when expenses change", () => {
    const queryClient = new QueryClient();
    const invalidate = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined);

    invalidateQueriesForRealtimeChange(queryClient, "user-1", {
      table: "expenses",
      groupId: "group-1",
    });

    expect(invalidate).toHaveBeenCalledWith({
      queryKey: settlementsKeys.debts("user-1"),
    });
  });

  it("does not refetch unrelated group metadata for settlement events", () => {
    const queryClient = new QueryClient();
    const invalidate = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined);

    invalidateQueriesForRealtimeChange(queryClient, "user-1", {
      table: "settlements",
      groupId: "group-1",
    });

    expect(invalidate).not.toHaveBeenCalledWith({
      queryKey: groupsKeys.detail("group-1", "user-1"),
    });
    expect(invalidate).not.toHaveBeenCalledWith({
      queryKey: groupsKeys.invite("group-1", "user-1"),
    });
  });

  it("deduplicates and orders canonical settlement history", () => {
    const older = settlement("old", "2026-07-01T00:00:00.000Z");
    const newer = settlement("new", "2026-07-03T00:00:00.000Z");
    const duplicateRetry = {
      ...settlement("canonical", "2026-07-02T00:00:00.000Z"),
      clientSettlementId: newer.clientSettlementId,
    };

    const result = reconcileSettlementHistory(
      [older, newer],
      duplicateRetry,
    );

    expect(result.map((item) => item.id)).toEqual(["canonical", "old"]);
  });

  it("suppresses one unexpired same-tab echo only", () => {
    registerRealtimeEcho("settlements", "client-1", 100, 1_000);

    expect(consumeRealtimeEcho("settlements", "client-1", 1_050)).toBe(true);
    expect(consumeRealtimeEcho("settlements", "client-1", 1_060)).toBe(false);

    registerRealtimeEcho("settlements", "client-2", 100, 1_000);
    expect(consumeRealtimeEcho("settlements", "client-2", 1_101)).toBe(false);
  });

  it("recovers only after a real disconnect", () => {
    expect(evaluateRealtimeRecovery(false, "SUBSCRIBED")).toEqual({
      needsRecovery: false,
      shouldRecover: false,
    });
    expect(evaluateRealtimeRecovery(false, "CHANNEL_ERROR")).toEqual({
      needsRecovery: true,
      shouldRecover: false,
    });
    expect(evaluateRealtimeRecovery(true, "SUBSCRIBED")).toEqual({
      needsRecovery: false,
      shouldRecover: true,
    });
  });
});
