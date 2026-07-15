"use client";

import { useState } from "react";
import { Mail, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AddMemberByEmailFormProps {
  onSubmit: (email: string) => void;
  isSubmitting?: boolean;
  className?: string;
}

export function AddMemberByEmailForm({
  onSubmit,
  isSubmitting = false,
  className,
}: AddMemberByEmailFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();

    if (!trimmed) {
      setError("Email is required.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError(null);
    onSubmit(trimmed.toLowerCase());
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "rounded-xl border border-border/80 bg-card p-4 shadow-sm min-[375px]:rounded-2xl min-[375px]:p-5",
        className,
      )}
    >
      <h2 className="font-heading text-base font-bold text-foreground">Add by email</h2>
      <FieldDescription className="mt-1.5">
        Enter the email of someone who already has an account. They will be added to the
        group immediately — no verification email is sent.
      </FieldDescription>

      <div className="mt-4 flex flex-col gap-3 min-[375px]:flex-row min-[375px]:items-end">
        <Field className="min-w-0 flex-1">
          <FieldLabel htmlFor="member-email">Email address</FieldLabel>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="member-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="friend@example.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) setError(null);
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
          type="submit"
          className="h-11 shrink-0 gap-2 min-[375px]:min-w-[8.5rem]"
          disabled={isSubmitting}
        >
          <UserPlus className="size-4" aria-hidden="true" />
          {isSubmitting ? "Adding…" : "Add member"}
        </Button>
      </div>
    </form>
  );
}
