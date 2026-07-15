import Link from "next/link";
import {
  ArrowLeftRight,
  Pencil,
  Receipt,
  UserPlus,
} from "lucide-react";
import { expenseDetailRoute } from "@/constants/routes";
import { PANEL_ROW_CLASS } from "@/components/layout/page-layout";
import type { GroupActivity, GroupActivityType } from "@/features/groups/types";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface GroupActivityCardProps {
  activity: GroupActivity;
  isLast?: boolean;
  className?: string;
}

const TYPE_CONFIG: Record<
  GroupActivityType,
  { icon: typeof Receipt; iconClass: string }
> = {
  expense: {
    icon: Receipt,
    iconClass: "text-primary bg-primary/10",
  },
  member_joined: {
    icon: UserPlus,
    iconClass: "text-sky-600 bg-sky-500/10",
  },
  settlement: {
    icon: ArrowLeftRight,
    iconClass: "text-emerald-600 bg-emerald-500/10",
  },
  group_updated: {
    icon: Pencil,
    iconClass: "text-amber-600 bg-amber-500/10",
  },
};

function ActivityCardContent({
  activity,
  isLast,
  className,
}: GroupActivityCardProps) {
  const { icon: Icon, iconClass } = TYPE_CONFIG[activity.type];

  return (
    <div
      className={cn(
        PANEL_ROW_CLASS,
        "flex min-h-[4rem] items-center gap-3 min-[375px]:min-h-[4.25rem]",
        !isLast && "border-b border-border/50",
        className,
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl",
          iconClass,
        )}
        aria-hidden="true"
      >
        <Icon className="size-4" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {activity.description}
        </p>
        <p className={cn("mt-0.5 truncate", META_TEXT_CLASS)}>{activity.timestamp}</p>
      </div>

      {activity.amount && (
        <p className="shrink-0 text-sm font-bold tabular-nums text-foreground">
          {activity.amount}
        </p>
      )}
    </div>
  );
}

export function GroupActivityCard({
  activity,
  isLast = false,
  className,
}: GroupActivityCardProps) {
  const isExpenseLink = activity.type === "expense" && !!activity.targetId;

  if (isExpenseLink) {
    return (
      <Link
        href={expenseDetailRoute(activity.targetId!)}
        className={cn(
          "block transition-colors hover:bg-accent/20 active:bg-accent/30",
          "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        )}
      >
        <ActivityCardContent activity={activity} isLast={isLast} className={className} />
      </Link>
    );
  }

  return (
    <article>
      <ActivityCardContent activity={activity} isLast={isLast} className={className} />
    </article>
  );
}
