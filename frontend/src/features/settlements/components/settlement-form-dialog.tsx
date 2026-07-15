"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { OutstandingDebt } from "@/features/settlements/types";
import { cn } from "@/lib/utils";

interface SettlementFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debt: OutstandingDebt | null;
  onSubmit: (amount: number, notes: string) => void;
  isSubmitting?: boolean;
}

interface SettlementFormBodyProps {
  debt: OutstandingDebt;
  onOpenChange: (open: boolean) => void;
  onSubmit: (amount: number, notes: string) => void;
  isSubmitting: boolean;
}

function SettlementFormBody({
  debt,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: SettlementFormBodyProps) {
  const [amount, setAmount] = useState(String(debt.amount));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = Number.parseFloat(amount);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Enter a valid amount greater than zero.");
      return;
    }

    if (parsed > debt.amount + 0.01) {
      setError(`Amount cannot exceed ${debt.amountLabel}.`);
      return;
    }

    setError(null);
    onSubmit(parsed, notes.trim());
  }

  const title =
    debt.direction === "you_owe"
      ? `Pay ${debt.toUserName}`
      : `Payment from ${debt.fromUserName}`;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
          value={amount}
          onChange={(event) => {
            setAmount(event.target.value);
            if (error) setError(null);
          }}
          aria-invalid={!!error}
          className="h-11"
        />
        <FieldDescription>Outstanding: {debt.amountLabel}</FieldDescription>
        {error && (
          <p role="alert" className="text-sm text-destructive">
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
          {isSubmitting ? "Recording…" : "Record settlement"}
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
            "fixed right-0 bottom-0 left-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-3xl border border-border bg-card p-5 shadow-xl",
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
            />
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
