"use client";

import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import { groupDetailRoute } from "@/constants/routes";
import type { GroupListItem } from "@/features/groups/types";
import { useCurrency } from "@/hooks/use-currency";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface GroupCardProps {
  group: GroupListItem;
  className?: string;
}

export function GroupCard({ group, className }: GroupCardProps) {
  const { formatCurrency } = useCurrency();
  const isOwed = group.balance >= 0;
  const balanceDisplay = formatCurrency(group.balance);

  return (
    <Link
      href={groupDetailRoute(group.id)}
      className={cn(
        "flex min-h-[4.5rem] w-full min-w-0 items-center gap-3 rounded-xl border bg-card p-4 text-left shadow-sm",
        "transition-all duration-150 active:scale-[0.99] min-[375px]:min-h-[4.75rem] min-[375px]:p-4.5",
        "hover:border-primary/20 hover:shadow-md",
        "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        isOwed ? "border-emerald-500/15" : group.balance < 0 ? "border-destructive/15" : "border-border/80",
        className,
      )}
    >
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-xl"
        aria-hidden="true"
      >
        {group.icon}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">{group.name}</p>
            <p className={cn("mt-1.5 flex items-center gap-1", META_TEXT_CLASS)}>
              <Users className="size-3.5 shrink-0 text-foreground/50" aria-hidden="true" />
              {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
            </p>
          </div>

          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums min-[375px]:text-[13px]",
              isOwed
                ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
                : group.balance < 0
                  ? "bg-destructive/12 text-destructive"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {balanceDisplay}
          </span>
        </div>

        <p className={cn("mt-1 truncate", META_TEXT_CLASS)}>{group.lastActivity}</p>
      </div>

      <ChevronRight
        className="size-4 shrink-0 text-muted-foreground/50"
        aria-hidden="true"
      />
    </Link>
  );
}
