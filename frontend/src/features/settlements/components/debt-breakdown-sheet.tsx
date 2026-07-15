"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DebtBreakdownLineItem } from "@/features/settlements/components/debt-breakdown-line";
import type { OutstandingDebt } from "@/features/settlements/types";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";

interface DebtBreakdownSheetProps {
  debt: OutstandingDebt | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DebtBreakdownSheet({
  debt,
  open,
  onOpenChange,
}: DebtBreakdownSheetProps) {
  if (!debt) return null;

  const isOwed = debt.direction === "owed_to_you";
  const summaryLabel = isOwed
    ? `${debt.fromUserName} owes you ${debt.amountLabel}`
    : `You owe ${debt.toUserName} ${debt.amountLabel}`;

  const { breakdown } = debt;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[90dvh] rounded-t-3xl border-t px-0 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2"
      >
        <SheetHeader className="border-b border-border/60 px-4 pb-4 text-left">
          <div className="flex items-start gap-3">
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-lg"
              aria-hidden="true"
            >
              {debt.groupIcon}
            </span>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-base font-semibold">Balance report</SheetTitle>
              <SheetDescription className="mt-1 text-sm leading-relaxed">
                {summaryLabel} in {debt.groupName}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-4 overflow-y-auto px-4 py-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-border/80 bg-card px-3 py-2.5 text-center">
              <p className="text-lg font-bold text-foreground">{breakdown.expenseCount}</p>
              <p className={cn("mt-0.5", META_TEXT_CLASS)}>Expenses</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-card px-3 py-2.5 text-center">
              <p className="text-lg font-bold text-foreground">{breakdown.settlementCount}</p>
              <p className={cn("mt-0.5", META_TEXT_CLASS)}>Payments</p>
            </div>
            <div
              className={cn(
                "rounded-xl border px-3 py-2.5 text-center",
                isOwed
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : "border-destructive/20 bg-destructive/5",
              )}
            >
              <p
                className={cn(
                  "text-lg font-bold tabular-nums",
                  isOwed
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-destructive",
                )}
              >
                {debt.amountLabel}
              </p>
              <p className={cn("mt-0.5", META_TEXT_CLASS)}>Outstanding</p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">
              How this balance was built
            </p>

            {breakdown.lines.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/80 px-4 py-8 text-center">
                <span className="flex size-11 items-center justify-center rounded-xl bg-muted/80 text-muted-foreground">
                  <FileText className="size-5" aria-hidden="true" />
                </span>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  No direct expense lines for this pair yet. The balance comes from simplified
                  group totals across members.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {breakdown.lines.map((line) => (
                  <DebtBreakdownLineItem
                    key={line.id}
                    line={line}
                    direction={debt.direction}
                  />
                ))}
              </div>
            )}
          </div>

          {breakdown.lines.length > 0 && (
            <div className="rounded-2xl border border-border/80 bg-muted/20 px-4 py-3.5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">Calculated net</p>
                <p
                  className={cn(
                    "text-sm font-bold tabular-nums",
                    isOwed
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-destructive",
                  )}
                >
                  {breakdown.calculatedNetLabel}
                </p>
              </div>
              <p className={cn("mt-1.5 leading-relaxed", META_TEXT_CLASS)}>
                Expense shares and recorded payments between these two people in this group.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
