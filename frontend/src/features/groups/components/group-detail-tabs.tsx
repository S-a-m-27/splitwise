"use client";

import { META_TEXT_SUBTLE_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

export type GroupDetailTab = "expenses" | "members" | "activity";

interface GroupDetailTabsProps {
  activeTab: GroupDetailTab;
  onTabChange: (tab: GroupDetailTab) => void;
  expenseCount: number;
  memberCount: number;
  activityCount: number;
  className?: string;
}

const TABS: { id: GroupDetailTab; label: string }[] = [
  { id: "expenses", label: "Expenses" },
  { id: "members", label: "Members" },
  { id: "activity", label: "Activity" },
];

export function GroupDetailTabs({
  activeTab,
  onTabChange,
  expenseCount,
  memberCount,
  activityCount,
  className,
}: GroupDetailTabsProps) {
  const counts: Record<GroupDetailTab, number> = {
    expenses: expenseCount,
    members: memberCount,
    activity: activityCount,
  };

  return (
    <div
      role="tablist"
      aria-label="Group sections"
      className={cn(
        "flex gap-1 rounded-xl border border-border/80 bg-muted/40 p-1",
        className,
      )}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`group-panel-${tab.id}`}
            id={`group-tab-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "min-h-11 flex-1 rounded-lg px-2 py-2 text-xs font-semibold transition-all duration-150",
              "min-[375px]:text-sm",
              "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              isActive
                ? "bg-card text-foreground shadow-sm"
                : "text-foreground/55 hover:text-foreground/80",
            )}
          >
            {tab.label}
            <span className={cn("ml-1", META_TEXT_SUBTLE_CLASS)}>
              ({counts[tab.id]})
            </span>
          </button>
        );
      })}
    </div>
  );
}
