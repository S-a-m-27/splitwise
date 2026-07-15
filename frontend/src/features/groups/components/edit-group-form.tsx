"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { GROUP_ICON_OPTIONS } from "@/features/groups/constants/group-icons";
import type { EditGroupFormValues, GroupDetail } from "@/features/groups/types";
import { cn } from "@/lib/utils";

interface EditGroupFormProps {
  group: GroupDetail;
  onSubmit: (values: EditGroupFormValues) => void;
  className?: string;
}

export function EditGroupForm({ group, onSubmit, className }: EditGroupFormProps) {
  const [values, setValues] = useState<EditGroupFormValues>({
    name: group.name,
    icon: group.icon,
    description: group.description ?? "",
  });
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
          <FieldLabel htmlFor="edit-group-name">Group name</FieldLabel>
          <Input
            id="edit-group-name"
            value={values.name}
            onChange={(event) => {
              setValues((current) => ({ ...current, name: event.target.value }));
              if (nameError) setNameError(null);
            }}
            aria-invalid={!!nameError}
            className="h-11"
          />
          {nameError && (
            <p role="alert" className="text-sm text-destructive">
              {nameError}
            </p>
          )}
        </Field>

        <Field>
          <FieldLabel>Group icon</FieldLabel>
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
          <FieldLabel htmlFor="edit-group-description">Description</FieldLabel>
          <textarea
            id="edit-group-description"
            value={values.description}
            onChange={(event) =>
              setValues((current) => ({ ...current, description: event.target.value }))
            }
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
        Save changes
      </Button>
    </form>
  );
}
