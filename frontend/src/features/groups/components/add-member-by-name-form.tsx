"use client";

import { useState } from "react";
import { UserRound, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AddMemberByNameFormProps {
  onSubmit: (name: string) => void;
  isSubmitting?: boolean;
  /** Compact layout for embedding inside another form (avoids nested <form>). */
  compact?: boolean;
  className?: string;
}

export function AddMemberByNameForm({
  onSubmit,
  isSubmitting = false,
  compact = false,
  className,
}: AddMemberByNameFormProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submitName() {
    const trimmed = name.trim();

    if (!trimmed) {
      setError("Name is required.");
      return;
    }

    if (trimmed.length > 80) {
      setError("Name must be 80 characters or less.");
      return;
    }

    setError(null);
    onSubmit(trimmed);
    setName("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    submitName();
  }

  const fields = (
    <>
      {!compact && (
        <>
          <h2 className="font-heading text-base font-bold text-foreground">Add by name</h2>
          <FieldDescription className="mt-1.5">
            Add someone who does not have an account yet. They will appear in expenses and
            balances just like registered members.
          </FieldDescription>
        </>
      )}

      <div
        className={cn(
          "flex flex-col gap-3",
          !compact && "mt-4 min-[375px]:flex-row min-[375px]:items-end",
        )}
      >
        <Field className="min-w-0 flex-1">
          {!compact && <FieldLabel htmlFor="member-name">Name</FieldLabel>}
          <div className="relative">
            <UserRound
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="member-name"
              type="text"
              autoComplete="name"
              placeholder="e.g. Ahmed"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(event) => {
                if (!compact) return;
                if (event.key === "Enter") {
                  event.preventDefault();
                  event.stopPropagation();
                  submitName();
                }
              }}
              aria-invalid={!!error}
              className="h-11 pl-9"
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </Field>

        <Button
          type={compact ? "button" : "submit"}
          className={cn(
            "h-11 shrink-0 gap-2",
            !compact && "min-[375px]:min-w-[8.5rem]",
            compact && "w-full",
          )}
          disabled={isSubmitting}
          onClick={compact ? () => submitName() : undefined}
        >
          <UserPlus className="size-4" aria-hidden="true" />
          {isSubmitting ? "Adding…" : compact ? "Add person" : "Add guest"}
        </Button>
      </div>
    </>
  );

  // Compact mode is embedded inside ExpenseForm — never nest <form> elements.
  if (compact) {
    return (
      <div className={cn("flex flex-col gap-3", className)} data-add-member-embedded>
        {fields}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "rounded-xl border border-border/80 bg-card p-4 shadow-sm min-[375px]:rounded-2xl min-[375px]:p-5",
        className,
      )}
    >
      {fields}
    </form>
  );
}
