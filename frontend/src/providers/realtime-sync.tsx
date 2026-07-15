"use client";

import type { ReactNode } from "react";
import { useRealtimeSync } from "@/lib/realtime/use-realtime-sync";

interface RealtimeSyncProps {
  children: ReactNode;
}

/** Keeps shared group data in sync across members via Supabase Realtime. */
export function RealtimeSync({ children }: RealtimeSyncProps) {
  useRealtimeSync();
  return <>{children}</>;
}
