"use client";

import { META_TEXT_SUBTLE_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

export type GroupDetailTab = "expenses" | "balances" | "members" | "activity" | "chat";

interface GroupDetailTabsProps {
  activeTab: GroupDetailTab;
  onTabChange: (tab: GroupDetailTab) => void;
  expenseCount: number | null;
  balanceCount: number | null;
  memberCount: number;
  activityCount: number | null;
  className?: string;
}

const TABS: { id: GroupDetailTab; label: string }[] = [
  { id: "expenses", label: "Expenses" },
  { id: "balances", label: "Balances" },
  { id: "members", label: "Members" },
  { id: "activity", label: "Activity" },
  { id: "chat", label: "Chat" },
];

export function GroupDetailTabs({
  activeTab,
  onTabChange,
  expenseCount,
  balanceCount,
  memberCount,
  activityCount,
  className,
}: GroupDetailTabsProps) {
  const counts: Record<GroupDetailTab, number | null> = {
    expenses: expenseCount,
    balances: balanceCount,
    members: memberCount,
    activity: activityCount,
    chat: null,
  };

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % TABS.length;
    if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
    }
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = TABS.length - 1;
    if (nextIndex === null) return;

    event.preventDefault();
    const nextTab = TABS[nextIndex];
    if (!nextTab) return;
    onTabChange(nextTab.id);
    document.getElementById(`group-tab-${nextTab.id}`)?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label="Group sections"
      className={cn(
        "flex gap-1 overflow-x-auto rounded-xl border border-border/80 bg-muted/40 p-1",
        className,
      )}
    >
      {TABS.map((tab, index) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`group-panel-${tab.id}`}
            id={`group-tab-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "min-h-11 shrink-0 flex-1 rounded-lg px-2 py-2 text-xs font-semibold transition-all duration-150",
              "min-[375px]:text-sm",
              "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              isActive
                ? "bg-card text-foreground shadow-sm"
                : "text-foreground/55 hover:text-foreground/80",
            )}
          >
            {tab.label}
            {counts[tab.id] !== null && (
              <span className={cn("ml-1", META_TEXT_SUBTLE_CLASS)}>
                ({counts[tab.id]})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
