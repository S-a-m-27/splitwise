"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/features/dashboard/components/user-avatar";
import type { OutstandingDebt } from "@/features/settlements/types";
import { parseSettlementFormValues } from "@/features/settlements/validation/settlements.schema";
import { formatCurrency } from "@/features/dashboard/utils/format-currency";
import { getInitials } from "@/features/dashboard/utils/get-initials";
import { cn } from "@/lib/utils";
import { ArrowDown, CheckCircle2, ShieldCheck } from "lucide-react";

interface SettlementFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debt: OutstandingDebt | null;
  onSubmit: (amount: number, notes: string) => void;
  isSubmitting?: boolean;
  submissionError?: string | null;
}

interface SettlementFormBodyProps {
  debt: OutstandingDebt;
  onOpenChange: (open: boolean) => void;
  onSubmit: (amount: number, notes: string) => void;
  isSubmitting: boolean;
  submissionError?: string | null;
}

function SettlementFormBody({
  debt,
  onOpenChange,
  onSubmit,
  isSubmitting,
  submissionError,
}: SettlementFormBodyProps) {
  const [step, setStep] = useState<"details" | "review">("details");
  const [amount, setAmount] = useState(String(debt.amount));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = parseSettlementFormValues({
      groupId: debt.groupId,
      fromUserId: debt.fromUserId,
      toUserId: debt.toUserId,
      amount,
      notes,
      maximumAmount: debt.amount,
    });

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Check the settlement details.");
      return;
    }

    setError(null);
    setAmount(String(result.data.amount));
    setNotes(result.data.notes ?? "");
    setStep("review");
  }

  const parsedAmount = Number.parseFloat(amount) || 0;
  const remaining = Math.max(0, debt.amount - parsedAmount);
  const title =
    debt.direction === "you_owe"
      ? `Pay ${debt.toUserName}`
      : `Payment from ${debt.fromUserName}`;

  if (step === "review") {
    return (
      <div className="flex flex-col gap-5">
        <div>
          <span className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <Dialog.Title className="font-heading text-xl font-bold text-foreground">
            Confirm settlement
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Review this payment carefully. It will update balances for everyone in{" "}
            {debt.groupName}.
          </Dialog.Description>
        </div>

        <div className="rounded-2xl border border-border/80 bg-muted/35 p-4">
          <div className="flex items-center gap-3">
            <UserAvatar
              name={debt.fromUserName}
              initials={getInitials(debt.fromUserName)}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Paying</p>
              <p className="truncate text-sm font-semibold">{debt.fromUserName}</p>
            </div>
          </div>
          <ArrowDown className="my-2 ml-3 size-4 text-muted-foreground" aria-hidden="true" />
          <div className="flex items-center gap-3">
            <UserAvatar
              name={debt.toUserName}
              initials={getInitials(debt.toUserName)}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Receiving</p>
              <p className="truncate text-sm font-semibold">{debt.toUserName}</p>
            </div>
          </div>
        </div>

        <dl className="divide-y divide-border/70 rounded-2xl border border-border/80 px-4">
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-sm text-muted-foreground">Payment</dt>
            <dd className="text-base font-bold tabular-nums">{formatCurrency(parsedAmount)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-sm text-muted-foreground">Current balance</dt>
            <dd className="text-sm font-semibold tabular-nums">{debt.amountLabel}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-sm text-muted-foreground">Remaining balance</dt>
            <dd className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatCurrency(remaining)}
            </dd>
          </div>
          {notes && (
            <div className="py-3">
              <dt className="text-sm text-muted-foreground">Note</dt>
              <dd className="mt-1 break-words text-sm font-medium">{notes}</dd>
            </div>
          )}
        </dl>

        {submissionError && (
          <p
            role="alert"
            aria-live="assertive"
            className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive"
          >
            {submissionError}
          </p>
        )}

        <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Confirm only after the payment has actually been made or received.
        </p>

        <div className="flex flex-col-reverse gap-2 min-[375px]:flex-row min-[375px]:justify-end">
          <Button
            type="button"
            variant="outline"
            className="h-11"
            onClick={() => setStep("details")}
            disabled={isSubmitting}
          >
            Back to edit
          </Button>
          <Button
            type="button"
            className="h-11"
            disabled={isSubmitting}
            onClick={() => onSubmit(parsedAmount, notes)}
          >
            {isSubmitting ? "Recording…" : `Confirm ${formatCurrency(parsedAmount)}`}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleReview} className="flex flex-col gap-5">
      <div>
        <Dialog.Title className="font-heading text-xl font-bold text-foreground">
          {title}
        </Dialog.Title>
        <Dialog.Description className="mt-2 text-sm text-muted-foreground">
          Record a settlement in {debt.groupName}. This updates balances for everyone in the
          group.
        </Dialog.Description>
      </div>

      <Field>
        <FieldLabel htmlFor="settlement-amount">Amount</FieldLabel>
        <Input
          id="settlement-amount"
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          max={debt.amount}
          value={amount}
          autoFocus
          onChange={(event) => {
            setAmount(event.target.value);
            if (error) setError(null);
          }}
          aria-invalid={!!error}
          aria-describedby={error ? "settlement-amount-error" : "settlement-amount-help"}
          className="h-11"
        />
        <FieldDescription id="settlement-amount-help">
          Outstanding: {debt.amountLabel}
        </FieldDescription>
        {error && (
          <p id="settlement-amount-error" role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </Field>

      <Field>
        <FieldLabel htmlFor="settlement-notes">Notes (optional)</FieldLabel>
        <Input
          id="settlement-notes"
          type="text"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="e.g. Bank transfer"
          maxLength={500}
          className="h-11"
        />
      </Field>

      <div className="flex flex-col-reverse gap-2 min-[375px]:flex-row min-[375px]:justify-end">
        <Button
          type="button"
          variant="outline"
          className="h-11"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button type="submit" className="h-11" disabled={isSubmitting}>
          Review settlement
        </Button>
      </div>
    </form>
  );
}

export function SettlementFormDialog({
  open,
  onOpenChange,
  debt,
  onSubmit,
  isSubmitting = false,
  submissionError,
}: SettlementFormDialogProps) {
  if (!debt) return null;

  const formKey = `${debt.groupId}-${debt.fromUserId}-${debt.toUserId}-${debt.amount}`;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            "fixed inset-0 z-50 bg-black/40 transition-opacity duration-150",
            "data-ending-style:opacity-0 data-starting-style:opacity-0",
            "supports-backdrop-filter:backdrop-blur-xs",
          )}
        />
        <Dialog.Popup
          className={cn(
            "fixed right-0 bottom-0 left-0 z-50 max-h-[90dvh] overflow-y-auto rounded-t-3xl border border-border bg-card p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl",
            "min-[375px]:left-1/2 min-[375px]:max-w-md min-[375px]:-translate-x-1/2 min-[375px]:rounded-2xl",
            "transition-all duration-200",
            "data-ending-style:translate-y-4 data-ending-style:opacity-0",
            "data-starting-style:translate-y-4 data-starting-style:opacity-0",
          )}
        >
          {open && (
            <SettlementFormBody
              key={formKey}
              debt={debt}
              onOpenChange={onOpenChange}
              onSubmit={onSubmit}
              isSubmitting={isSubmitting}
              submissionError={submissionError}
            />
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
