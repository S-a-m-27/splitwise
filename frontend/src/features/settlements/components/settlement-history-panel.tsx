"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityFeedSkeleton } from "@/features/dashboard/components/dashboard-skeleton";
import { DashboardErrorState } from "@/features/dashboard/components/dashboard-error-state";
import {
  DashboardSectionEmpty,
  DashboardSectionPanel,
} from "@/features/dashboard/components/dashboard-section-panel";
import type { SettlementListItem } from "@/features/settlements/types";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface SettlementHistoryPanelProps {
  history: readonly SettlementListItem[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string | null;
  onRetry: () => void;
  pageSize?: number;
  emptyDescription?: string;
}

function formatSettlementDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function SettlementHistoryPanel({
  history,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  pageSize = 8,
  emptyDescription = "When you record a payment, it will appear here.",
}: SettlementHistoryPanelProps) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const visibleHistory = useMemo(
    () => history.slice(0, visibleCount),
    [history, visibleCount],
  );

  return (
    <DashboardSectionPanel>
      {isLoading ? (
        <div className="p-3 min-[375px]:p-4">
          <ActivityFeedSkeleton />
        </div>
      ) : isError ? (
        <div className="p-4">
          <DashboardErrorState
            message={errorMessage ?? "Unable to load settlement history."}
            onRetry={onRetry}
          />
        </div>
      ) : history.length === 0 ? (
        <DashboardSectionEmpty
          title="No settlements yet"
          description={emptyDescription}
        />
      ) : (
        <>
          <div role="list" aria-label="Settlement history">
            {visibleHistory.map((item, index) => (
              <article
                key={item.id}
                role="listitem"
                className={cn(
                  "flex min-w-0 gap-3 px-4 py-4 md:px-5",
                  index < visibleHistory.length - 1 && "border-b border-border/50",
                )}
              >
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600"
                  aria-hidden="true"
                >
                  <CheckCircle2 className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {item.fromUserName} paid {item.toUserName}
                      </p>
                      <p className={cn("mt-0.5 truncate", META_TEXT_CLASS)}>
                        {item.groupIcon} {item.groupName} · {formatSettlementDate(item.createdAt)}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold tabular-nums text-foreground">
                      {item.amountLabel}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                      Recorded
                    </span>
                    {item.notes && (
                      <p className={cn("min-w-0 truncate", META_TEXT_CLASS)} title={item.notes}>
                        {item.notes}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
          {visibleCount < history.length && (
            <div className="border-t border-border/60 p-3">
              <Button
                type="button"
                variant="ghost"
                className="h-11 w-full gap-2"
                onClick={() => setVisibleCount((count) => count + pageSize)}
              >
                Show more
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          )}
        </>
      )}
    </DashboardSectionPanel>
  );
}
