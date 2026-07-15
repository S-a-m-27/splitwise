"use client";

import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import { PANEL_ROW_CLASS } from "@/components/layout/page-layout";
import { groupDetailRoute } from "@/constants/routes";
import type { GroupPreview } from "@/features/dashboard/types";
import { formatCurrency } from "@/features/dashboard/utils/format-currency";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface GroupPreviewCardProps {
  group: GroupPreview;
  isLast?: boolean;
  className?: string;
}

/** Compact group row — matches ActivityCard inside a shared section panel. */
export function GroupPreviewCard({ group, isLast = false, className }: GroupPreviewCardProps) {
  const isOwed = group.balance >= 0;
  const balanceDisplay = formatCurrency(group.balance);

  return (
    <Link
      href={groupDetailRoute(group.id)}
      className={cn(
        PANEL_ROW_CLASS,
        "flex min-h-[4rem] w-full min-w-0 items-center gap-3 text-left",
        "transition-colors active:bg-accent/30 min-[375px]:min-h-[4.25rem] md:px-5",
        "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        !isLast && "border-b border-border/50",
        className,
      )}
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-lg min-[375px]:size-10 min-[375px]:rounded-xl min-[375px]:text-xl"
        aria-hidden="true"
      >
        {group.icon}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-foreground min-[375px]:text-sm">
              {group.name}
            </p>
            <p className={cn("mt-0.5 flex items-center gap-1 truncate", META_TEXT_CLASS)}>
              <Users className="size-3 shrink-0 text-foreground/50" aria-hidden="true" />
              {group.memberCount} · {group.lastActivity}
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums min-[375px]:text-[13px]",
              isOwed
                ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
                : "bg-destructive/12 text-destructive",
            )}
          >
            {balanceDisplay}
          </span>
        </div>
      </div>

      <ChevronRight
        className="size-4 shrink-0 text-muted-foreground/40"
        aria-hidden="true"
      />
    </Link>
  );
}
