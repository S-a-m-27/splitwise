"use client";

import type { OutstandingDebt } from "@/features/settlements/types";
import { DebtBreakdownLineItem } from "@/features/settlements/components/debt-breakdown-line";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DebtCardProps {
  debt: OutstandingDebt;
  onSettle: (debt: OutstandingDebt) => void;
  onViewReport: (debt: OutstandingDebt) => void;
  className?: string;
}

/** Outstanding balance card with settle action and debt report preview. */
export function DebtCard({ debt, onSettle, onViewReport, className }: DebtCardProps) {
  const isOwed = debt.direction === "owed_to_you";
  const previewLines = debt.breakdown.lines.slice(0, 2);
  const hasMoreLines = debt.breakdown.lines.length > previewLines.length;

  return (
    <article
      className={cn(
        "rounded-2xl border bg-card p-4 shadow-sm min-[375px]:p-5",
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

          {(debt.breakdown.expenseCount > 0 || debt.breakdown.settlementCount > 0) && (
            <p className={cn("mt-2", META_TEXT_CLASS)}>
              {debt.breakdown.expenseCount} expense
              {debt.breakdown.expenseCount === 1 ? "" : "s"}
              {debt.breakdown.settlementCount > 0 &&
                ` · ${debt.breakdown.settlementCount} payment${debt.breakdown.settlementCount === 1 ? "" : "s"}`}
            </p>
          )}
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

      {previewLines.length > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
            Recent activity
          </p>
          {previewLines.map((line) => (
            <DebtBreakdownLineItem
              key={line.id}
              line={line}
              direction={debt.direction}
              compact
            />
          ))}
          {hasMoreLines && (
            <p className={cn("px-1", META_TEXT_CLASS)}>
              +{debt.breakdown.lines.length - previewLines.length} more line
              {debt.breakdown.lines.length - previewLines.length === 1 ? "" : "s"}
            </p>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "mt-4 flex items-center gap-2 rounded-xl border border-dashed border-border/80 px-3 py-2.5",
            META_TEXT_CLASS,
          )}
        >
          <FileText className="size-4 shrink-0" aria-hidden="true" />
          <p className="text-xs leading-relaxed min-[375px]:text-[13px]">
            Simplified group balance — open the report for details.
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 min-[375px]:flex-row">
        <Button
          type="button"
          variant="outline"
          className="h-11 flex-1 rounded-xl font-semibold"
          onClick={() => onViewReport(debt)}
        >
          View report
        </Button>
        <Button
          type="button"
          className="h-11 flex-1 rounded-xl font-semibold"
          variant={isOwed ? "outline" : "default"}
          onClick={() => onSettle(debt)}
        >
          {isOwed ? "Record payment" : "Settle up"}
        </Button>
      </div>
    </article>
  );
}
