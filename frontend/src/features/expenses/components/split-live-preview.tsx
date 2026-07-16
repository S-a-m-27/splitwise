"use client";

import { useMemo } from "react";
import { AlertCircle, Sparkles, Wand2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { SplitTypeSelector } from "@/features/expenses/components/split-type-selector";
import { getSplitTypeLabel } from "@/features/expenses/constants/split-types";
import type { ExpenseParticipant, SplitType } from "@/features/expenses/types";
import { buildSplitPreview } from "@/features/expenses/utils/split-preview";
import { useCurrency } from "@/hooks/use-currency";
import { META_LABEL_CLASS, META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface SplitLivePreviewProps {
  amount: string;
  participants: ExpenseParticipant[];
  participantIds: string[];
  paidById: string;
  splitType: SplitType;
  splitValues: Record<string, string>;
  onSplitTypeChange: (splitType: SplitType) => void;
  onSplitValueChange: (participantId: string, value: string) => void;
  className?: string;
}

const VISIBLE_AVATAR_COUNT = 5;

export function SplitLivePreview({
  amount,
  participants,
  participantIds,
  paidById,
  splitType,
  splitValues,
  onSplitTypeChange,
  onSplitValueChange,
  className,
}: SplitLivePreviewProps) {
  const { formatMoney, symbol } = useCurrency();
  const parsedAmount = Number.parseFloat(amount);
  const hasValidAmount = !Number.isNaN(parsedAmount) && parsedAmount > 0;
  const count = participantIds.length;

  const selectedParticipants = useMemo(
    () =>
      participantIds
        .map((id) => participants.find((p) => p.id === id))
        .filter((participant): participant is ExpenseParticipant => !!participant),
    [participantIds, participants],
  );

  const payer = participants.find((p) => p.id === paidById);

  const preview = useMemo(() => {
    if (!hasValidAmount || !payer) {
      return null;
    }

    return buildSplitPreview({
      amount: parsedAmount,
      participantIds,
      splitType,
      splitValues,
      payerName: payer.name,
      payerIsCurrentUser: !!payer.isCurrentUser,
    });
  }, [
    hasValidAmount,
    parsedAmount,
    participantIds,
    splitType,
    splitValues,
    payer,
  ]);

  const visibleAvatars = selectedParticipants.slice(0, VISIBLE_AVATAR_COUNT);
  const hiddenCount = Math.max(selectedParticipants.length - VISIBLE_AVATAR_COUNT, 0);

  function renderInputSuffix(participantId: string, lineValue: string, displayAmount: number) {
    if (splitType === "equal") {
      return (
        <p className="shrink-0 text-sm font-bold tabular-nums text-primary">
          {formatMoney(displayAmount)}
        </p>
      );
    }

    if (splitType === "exact") {
      return (
        <div className="relative w-24 shrink-0">
          <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
            {symbol}
          </span>
          <Input
            type="text"
            inputMode="decimal"
            value={lineValue}
            onChange={(event) => {
              const next = event.target.value.replace(/[^\d.]/g, "");
              onSplitValueChange(participantId, next);
            }}
            className="h-9 border-primary/20 bg-background/70 pl-6 text-right text-sm font-semibold tabular-nums"
            aria-label="Exact amount"
          />
        </div>
      );
    }

    if (splitType === "percentage") {
      return (
        <div className="relative w-20 shrink-0">
          <Input
            type="text"
            inputMode="decimal"
            value={lineValue}
            onChange={(event) => {
              const next = event.target.value.replace(/[^\d.]/g, "");
              onSplitValueChange(participantId, next);
            }}
            className="h-9 border-primary/20 bg-background/70 pr-6 text-right text-sm font-semibold tabular-nums"
            aria-label="Percentage"
          />
          <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
            %
          </span>
        </div>
      );
    }

    return (
      <div className="relative w-16 shrink-0">
        <Input
          type="text"
          inputMode="numeric"
          value={lineValue}
          onChange={(event) => {
            const next = event.target.value.replace(/\D/g, "");
            onSplitValueChange(participantId, next);
          }}
          className="h-9 border-primary/20 bg-background/70 text-center text-sm font-semibold tabular-nums"
          aria-label="Shares"
        />
      </div>
    );
  }

  return (
    <article
      className={cn(
        "rounded-2xl border border-border/70 bg-card/80 p-3.5 shadow-sm",
        "min-[375px]:rounded-[1.35rem] min-[375px]:p-4",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className={cn("flex items-center gap-1.5", META_LABEL_CLASS)}>
          <Wand2 className="size-3.5 text-primary" aria-hidden="true" />
          Live split
        </p>
        <div className="flex items-center gap-3 text-right">
          <div>
            <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
              {splitType === "shares" ? "Per share" : "Per person"}
            </p>
            <p className="text-sm font-bold tabular-nums text-primary">
              {preview?.lines[0] ? formatMoney(preview.lines[0].displayAmount) : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
              People
            </p>
            <p className="text-sm font-bold tabular-nums text-foreground">{count || "—"}</p>
          </div>
        </div>
      </div>

      {!hasValidAmount && (
        <p className={cn("mt-2", META_TEXT_CLASS)}>
          Enter an amount above to see how it splits.
        </p>
      )}

      {selectedParticipants.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            {visibleAvatars.map((participant) => (
              <span
                key={participant.id}
                className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-muted/40 py-0.5 pr-2 pl-0.5"
              >
                <Avatar size="sm" className="size-5">
                  <AvatarFallback className="bg-primary/15 text-[8px] font-bold text-primary">
                    {participant.initials}
                  </AvatarFallback>
                </Avatar>
                <span className="max-w-[4rem] truncate text-[11px] font-medium text-foreground">
                  {participant.isCurrentUser ? "You" : participant.name.split(" ")[0]}
                </span>
              </span>
            ))}
            {hiddenCount > 0 && (
              <span className="inline-flex h-5 items-center rounded-full bg-muted px-1.5 text-[11px] font-bold text-foreground">
                +{hiddenCount}
              </span>
            )}
          </div>
        </div>
      )}

      {hasValidAmount && count > 0 && (
        <div className="mt-3">
          <SplitTypeSelector value={splitType} onChange={onSplitTypeChange} />
        </div>
      )}

      {hasValidAmount && preview && preview.lines.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className={META_LABEL_CLASS}>{getSplitTypeLabel(splitType)} breakdown</p>
          <ul className="flex max-h-44 flex-col gap-1.5 overflow-y-auto pr-0.5">
            {preview.lines.map((line) => {
              const participant = participants.find((p) => p.id === line.participantId);
              if (!participant) return null;

              return (
                <li
                  key={line.participantId}
                  className="flex min-h-10 items-center gap-2 rounded-xl border border-border/50 bg-background/50 px-2.5 py-1.5"
                >
                  <Avatar size="sm" className="size-7 shrink-0">
                    <AvatarFallback className="bg-primary/15 text-[10px] font-bold text-primary">
                      {participant.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {participant.name}
                      {participant.isCurrentUser && (
                        <span className="ml-1 font-normal text-muted-foreground">(you)</span>
                      )}
                    </p>
                    {splitType !== "equal" && (
                      <p className="text-xs tabular-nums text-muted-foreground">
                        → {formatMoney(line.displayAmount)}
                      </p>
                    )}
                  </div>
                  {renderInputSuffix(line.participantId, line.inputValue, line.displayAmount)}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {hasValidAmount && preview && (
        <p
          className={cn(
            "mt-3 flex items-start gap-2 rounded-xl px-3 py-2",
            preview.isValid ? "bg-primary/8" : "bg-amber-500/10",
            META_TEXT_CLASS,
          )}
        >
          {preview.isValid ? (
            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
          ) : (
            <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          )}
          <span className={preview.isValid ? "text-foreground/85" : "text-amber-800 dark:text-amber-200"}>
            {preview.summaryLabel}
          </span>
        </p>
      )}
    </article>
  );
}
