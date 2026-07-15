import { ArrowLeftRight, Receipt } from "lucide-react";
import { PANEL_ROW_CLASS } from "@/components/layout/page-layout";
import type { ActivityItem } from "@/features/dashboard/types";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface ActivityCardProps {
  activity: ActivityItem;
  isLast?: boolean;
  className?: string;
}

const TYPE_CONFIG = {
  expense: {
    icon: Receipt,
    iconClass: "text-primary bg-primary/10",
  },
  settlement: {
    icon: ArrowLeftRight,
    iconClass: "text-emerald-600 bg-emerald-500/10",
  },
  payment: {
    icon: ArrowLeftRight,
    iconClass: "text-emerald-600 bg-emerald-500/10",
  },
} as const;

/** Compact activity row for 320px screens. */
export function ActivityCard({ activity, isLast = false, className }: ActivityCardProps) {
  const { icon: Icon, iconClass } = TYPE_CONFIG[activity.type];

  return (
    <article
      className={cn(
        PANEL_ROW_CLASS,
        "flex min-h-[4rem] min-w-0 items-center gap-3 active:bg-accent/30",
        "min-[375px]:min-h-[4.25rem] md:px-5",
        !isLast && "border-b border-border/50",
        className,
      )}
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg min-[375px]:size-9 min-[375px]:rounded-xl md:size-10",
          iconClass,
        )}
      >
        <Icon className="size-3.5 min-[375px]:size-4" aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-foreground min-[375px]:text-sm">
          {activity.description}
        </p>
        <p className={cn("mt-0.5 truncate", META_TEXT_CLASS)}>
          {activity.groupName} · {activity.timestamp}
        </p>
      </div>

      {activity.amount && (
        <p className="shrink-0 text-[13px] font-bold tabular-nums text-foreground min-[375px]:text-sm">
          {activity.amount}
        </p>
      )}
    </article>
  );
}
