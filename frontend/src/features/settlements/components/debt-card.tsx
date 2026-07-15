import type { OutstandingDebt } from "@/features/settlements/types";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DebtCardProps {
  debt: OutstandingDebt;
  onSettle: (debt: OutstandingDebt) => void;
  className?: string;
}

/** Outstanding balance card with settle action. */
export function DebtCard({ debt, onSettle, className }: DebtCardProps) {
  const isOwed = debt.direction === "owed_to_you";

  return (
    <article
      className={cn(
        "rounded-2xl border bg-card p-5 shadow-sm min-[375px]:p-5",
        isOwed ? "border-emerald-500/20" : "border-destructive/20",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl text-lg",
            isOwed ? "bg-emerald-500/12" : "bg-destructive/10",
          )}
          aria-hidden="true"
        >
          {debt.groupIcon}
        </span>

        <div className="min-w-0 flex-1">
          <p className={cn("truncate", META_TEXT_CLASS)}>{debt.groupName}</p>
          <p className="mt-1.5 text-sm font-semibold leading-relaxed text-foreground min-[375px]:text-[15px]">
            {isOwed
              ? `${debt.fromUserName} owes you ${debt.amountLabel}`
              : `You owe ${debt.toUserName} ${debt.amountLabel}`}
          </p>
        </div>

        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl",
            isOwed
              ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
              : "bg-destructive/10 text-destructive",
          )}
        >
          {isOwed ? (
            <ArrowDownLeft className="size-4" aria-hidden="true" />
          ) : (
            <ArrowUpRight className="size-4" aria-hidden="true" />
          )}
        </span>
      </div>

      <Button
        type="button"
        className="mt-5 h-11 w-full rounded-xl font-semibold"
        variant={isOwed ? "outline" : "default"}
        onClick={() => onSettle(debt)}
      >
        {isOwed ? "Record payment received" : "Record payment"}
      </Button>
    </article>
  );
}
