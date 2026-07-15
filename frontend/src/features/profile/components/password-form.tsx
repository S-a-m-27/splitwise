"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { PasswordFormValues } from "@/features/profile/types";
import { cn } from "@/lib/utils";

interface PasswordFormProps {
  onSubmit: (values: PasswordFormValues) => void;
  isSubmitting?: boolean;
  className?: string;
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  error,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <Lock
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={!!error}
          className="h-11 pr-11 pl-9"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className={cn(
            "absolute top-1/2 right-1 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg",
            "text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          )}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </Field>
  );
}

/** Change password form — verifies current password via Supabase Auth. */
export function PasswordForm({ onSubmit, isSubmitting = false, className }: PasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof PasswordFormValues, string>>>({});

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Partial<Record<keyof PasswordFormValues, string>> = {};

    if (!currentPassword) {
      nextErrors.currentPassword = "Current password is required.";
    }

    if (!newPassword) {
      nextErrors.newPassword = "New password is required.";
    } else if (newPassword.length < 8) {
      nextErrors.newPassword = "Password must be at least 8 characters.";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your new password.";
    } else if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({ currentPassword, newPassword, confirmPassword });
  }

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-6", className)}>
      <section
        aria-labelledby="password-security-heading"
        className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm min-[375px]:p-5"
      >
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <KeyRound className="size-4.5" aria-hidden="true" />
          </span>
          <div>
            <h2
              id="password-security-heading"
              className="font-heading text-base font-bold text-foreground"
            >
              Update password
            </h2>
            <FieldDescription className="mt-1">
              Choose a strong password you have not used elsewhere.
            </FieldDescription>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-4">
          <PasswordField
            id="current-password"
            label="Current password"
            value={currentPassword}
            onChange={setCurrentPassword}
            error={errors.currentPassword}
            autoComplete="current-password"
          />
          <PasswordField
            id="new-password"
            label="New password"
            value={newPassword}
            onChange={setNewPassword}
            error={errors.newPassword}
            autoComplete="new-password"
          />
          <PasswordField
            id="confirm-password"
            label="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            error={errors.confirmPassword}
            autoComplete="new-password"
          />
        </div>
      </section>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-12 w-full rounded-xl text-base font-bold shadow-md shadow-primary/20"
      >
        {isSubmitting ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
