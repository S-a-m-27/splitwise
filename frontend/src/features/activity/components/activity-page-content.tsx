"use client";

import { useState } from "react";
import { Activity, ArrowLeftRight, Receipt } from "lucide-react";
import { PageHeader, PageStack, SECTION_STACK_CLASS } from "@/components/layout/page-layout";
import { ActivityCard } from "@/features/dashboard/components/activity-card";
import { DashboardErrorState } from "@/features/dashboard/components/dashboard-error-state";
import { DashboardSectionPanel } from "@/features/dashboard/components/dashboard-section-panel";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { ActivityFeedSkeleton } from "@/features/dashboard/components/dashboard-skeleton";
import { EmptyState } from "@/features/groups/components/empty-state";
import {
  useActivityFeed,
} from "@/features/activity/hooks/use-activity";
import type { ActivityFilter } from "@/features/activity/services/activity.service";
import { cn } from "@/lib/utils";

const FILTERS: { id: ActivityFilter; label: string; icon: typeof Receipt }[] = [
  { id: "all", label: "All", icon: Activity },
  { id: "expenses", label: "Expenses", icon: Receipt },
  { id: "settlements", label: "Settlements", icon: ArrowLeftRight },
];

export function ActivityPageContent() {
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const { data, isLoading, isError, error, refetch, isEmpty } = useActivityFeed({
    filter,
  });

  return (
    <DashboardShell>
      <PageStack>
        <PageHeader
          title="Activity"
          description="Expenses and settlements across all your groups."
        />

        <div
          className="flex gap-2.5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Activity filters"
        >
          {FILTERS.map((item) => {
            const Icon = item.icon;
            const isActive = filter === item.id;

            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setFilter(item.id)}
                className={cn(
                  "inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors",
                  "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  isActive
                    ? "border-primary/35 bg-primary/12 text-primary shadow-sm"
                    : "border-border/80 bg-card text-foreground/80 hover:bg-muted/40",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
        </div>

        <section className={SECTION_STACK_CLASS}>
          <DashboardSectionPanel>
            {isLoading ? (
              <div className="p-4 min-[375px]:p-5">
                <ActivityFeedSkeleton />
              </div>
            ) : isError ? (
              <div className="p-5">
                <DashboardErrorState
                  message={
                    error instanceof Error ? error.message : "Failed to load activity."
                  }
                  onRetry={() => refetch()}
                />
              </div>
            ) : isEmpty ? (
              <EmptyState
                title="No activity yet"
                description="Expenses and settlements will show up here once you add them."
              />
            ) : (
              <div>
                {data.map((item, index) => (
                  <ActivityCard
                    key={item.id}
                    activity={item}
                    isLast={index === data.length - 1}
                  />
                ))}
              </div>
            )}
          </DashboardSectionPanel>
        </section>
      </PageStack>
    </DashboardShell>
  );
}
