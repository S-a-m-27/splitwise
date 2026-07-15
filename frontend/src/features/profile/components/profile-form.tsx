"use client";

import { useState } from "react";
import { Camera, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/features/dashboard/components/user-avatar";
import type { ProfileFormValues, ProfileUser } from "@/features/profile/types";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface ProfileFormProps {
  profile: ProfileUser;
  onSubmit: (values: ProfileFormValues) => void;
  isSubmitting?: boolean;
  className?: string;
}

/** Edit profile form — persists name to Supabase profiles. */
export function ProfileForm({
  profile,
  onSubmit,
  isSubmitting = false,
  className,
}: ProfileFormProps) {
  const [fullName, setFullName] = useState(profile.fullName);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = fullName.trim();

    if (!trimmed) {
      setError("Full name is required.");
      return;
    }

    if (trimmed.length > 80) {
      setError("Name must be 80 characters or less.");
      return;
    }

    setError(null);
    onSubmit({ fullName: trimmed });
  }

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-6", className)}>
      <section
        aria-labelledby="avatar-upload-heading"
        className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm min-[375px]:p-5"
      >
        <h2 id="avatar-upload-heading" className="font-heading text-base font-bold text-foreground">
          Profile photo
        </h2>
        <FieldDescription className="mt-1.5">
          Avatar upload will be available when backend integration ships.
        </FieldDescription>

        <div className="mt-4 flex flex-col items-center gap-4 min-[375px]:flex-row min-[375px]:items-center">
          <UserAvatar
            name={fullName || profile.fullName}
            avatarUrl={profile.avatarUrl}
            initials={profile.initials}
            size="lg"
            className="size-16 text-lg"
          />

          <button
            type="button"
            disabled
            aria-disabled="true"
            aria-label="Upload profile photo — coming soon"
            className={cn(
              "flex h-24 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed",
              "border-primary/25 bg-primary/5 text-center transition-colors",
              "min-[375px]:h-20 min-[375px]:flex-1",
              "cursor-not-allowed opacity-80",
            )}
          >
            <Camera className="size-5 text-primary" aria-hidden="true" />
            <span className="text-sm font-semibold text-foreground">Upload photo</span>
            <span className={META_TEXT_CLASS}>JPG or PNG, max 2 MB</span>
          </button>
        </div>
      </section>

      <section
        aria-labelledby="profile-details-heading"
        className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm min-[375px]:p-5"
      >
        <h2 id="profile-details-heading" className="font-heading text-base font-bold text-foreground">
          Personal details
        </h2>

        <div className="mt-4 flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="profile-full-name">Full name</FieldLabel>
            <div className="relative">
              <UserRound
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="profile-full-name"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(event) => {
                  setFullName(event.target.value);
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

          <Field>
            <FieldLabel htmlFor="profile-email">Email</FieldLabel>
            <Input
              id="profile-email"
              type="email"
              value={profile.email}
              readOnly
              disabled
              className="h-11 bg-muted/40"
            />
            <FieldDescription>Email is managed through your account settings.</FieldDescription>
          </Field>
        </div>
      </section>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-12 w-full rounded-xl text-base font-bold shadow-md shadow-primary/20"
      >
        {isSubmitting ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
