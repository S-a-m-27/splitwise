"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { GROUP_ICON_OPTIONS, DEFAULT_GROUP_ICON } from "@/features/groups/constants/group-icons";
import { GROUP_TYPE_OPTIONS } from "@/features/groups/constants/group-types";
import type { CreateGroupFormValues, GroupType } from "@/features/groups/types";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface CreateGroupFormProps {
  onSubmit: (values: CreateGroupFormValues) => void;
  submitLabel?: string;
  className?: string;
}

const INITIAL_VALUES: CreateGroupFormValues = {
  name: "",
  type: "friends",
  icon: DEFAULT_GROUP_ICON,
  description: "",
};

export function CreateGroupForm({
  onSubmit,
  submitLabel = "Create group",
  className,
}: CreateGroupFormProps) {
  const [values, setValues] = useState<CreateGroupFormValues>(INITIAL_VALUES);
  const [nameError, setNameError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = values.name.trim();
    if (!trimmedName) {
      setNameError("Group name is required.");
      return;
    }

    setNameError(null);
    onSubmit({ ...values, name: trimmedName });
  }

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-5", className)}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="group-name">Group name</FieldLabel>
          <Input
            id="group-name"
            value={values.name}
            onChange={(event) => {
              setValues((current) => ({ ...current, name: event.target.value }));
              if (nameError) setNameError(null);
            }}
            placeholder="e.g. Weekend in Murree"
            aria-invalid={!!nameError}
            className="h-11"
            autoComplete="off"
          />
          {nameError && (
            <p role="alert" className="text-sm text-destructive">
              {nameError}
            </p>
          )}
        </Field>

        <Field>
          <FieldLabel>Group type</FieldLabel>
          <div className="grid grid-cols-2 gap-2 min-[375px]:gap-2.5">
            {GROUP_TYPE_OPTIONS.map((option) => {
              const selected = values.type === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setValues((current) => ({
                      ...current,
                      type: option.value as GroupType,
                    }))
                  }
                  className={cn(
                    "min-h-11 rounded-xl border px-3 py-2.5 text-left transition-all duration-150",
                    "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                    selected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border/80 bg-card hover:border-primary/30",
                  )}
                  aria-pressed={selected}
                >
                  <span className="block text-sm font-semibold text-foreground">
                    {option.label}
                  </span>
                  <span className={cn("mt-1 block", META_TEXT_CLASS)}>
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </Field>

        <Field>
          <FieldLabel>Group icon</FieldLabel>
          <FieldDescription>Choose an emoji for your group.</FieldDescription>
          <div
            className="grid grid-cols-6 gap-1.5 min-[375px]:gap-2"
            role="radiogroup"
            aria-label="Group icon"
          >
            {GROUP_ICON_OPTIONS.map((icon) => {
              const selected = values.icon === icon;

              return (
                <button
                  key={icon}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setValues((current) => ({ ...current, icon }))}
                  className={cn(
                    "flex size-11 items-center justify-center rounded-xl border text-lg transition-all duration-150",
                    "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                    selected
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border/80 bg-card hover:border-primary/30",
                  )}
                >
                  <span aria-hidden="true">{icon}</span>
                </button>
              );
            })}
          </div>
        </Field>

        <Field>
          <FieldLabel htmlFor="group-description">
            Description <span className="font-normal text-muted-foreground">(optional)</span>
          </FieldLabel>
          <textarea
            id="group-description"
            value={values.description}
            onChange={(event) =>
              setValues((current) => ({ ...current, description: event.target.value }))
            }
            placeholder="What is this group for?"
            rows={3}
            className={cn(
              "w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm",
              "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              "dark:bg-input/30",
            )}
          />
        </Field>
      </FieldGroup>

      <Button type="submit" className="h-11 w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
