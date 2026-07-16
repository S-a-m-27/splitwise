"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import {
  invalidateQueriesForRealtimeChange,
  type RealtimeTable,
} from "@/lib/realtime/invalidate-queries";
import { toRealtimeChangeContext } from "@/lib/realtime/parse-payload";

const REALTIME_TABLES: RealtimeTable[] = [
  "expenses",
  "expense_participants",
  "settlements",
  "group_members",
  "group_guests",
  "groups",
  "group_invitations",
  "notifications",
  "group_activities",
];

const DEBOUNCE_MS = 350;

/**
 * Subscribes to Supabase Realtime postgres changes and invalidates
 * TanStack Query caches so all group members see updates without refresh.
 */
export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const { user, isLoading } = useAuth();
  const userId = user?.id;
  const pendingRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    if (isLoading || !userId || !hasSupabaseEnv()) {
      return;
    }

    const pendingTimers = pendingRef.current;

    const supabase = createClient();

    const scheduleInvalidation = (
      table: RealtimeTable,
      payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
    ) => {
      const context = toRealtimeChangeContext(table, payload);
      const key = `${table}:${context.groupId ?? "all"}:${context.expenseId ?? "all"}`;

      const existing = pendingRef.current.get(key);
      if (existing) {
        clearTimeout(existing);
      }

      const timer = setTimeout(() => {
        pendingRef.current.delete(key);
        invalidateQueriesForRealtimeChange(queryClient, userId, context);
      }, DEBOUNCE_MS);

      pendingRef.current.set(key, timer);
    };

    const channel: RealtimeChannel = supabase.channel(`splitwise-sync:${userId}`);

    for (const table of REALTIME_TABLES) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload) => scheduleInvalidation(table, payload),
      );
    }

    channel.subscribe();

    return () => {
      for (const timer of pendingTimers.values()) {
        clearTimeout(timer);
      }
      pendingTimers.clear();
      void supabase.removeChannel(channel);
    };
  }, [isLoading, queryClient, userId]);
}
