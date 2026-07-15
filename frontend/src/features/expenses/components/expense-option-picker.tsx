"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { PickerOption } from "@/features/expenses/types/picker";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface ExpenseOptionPickerProps {
  id?: string;
  label: string;
  value: string;
  options: PickerOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  sheetTitle?: string;
  sheetDescription?: string;
  hideLabel?: boolean;
  className?: string;
}

export function ExpenseOptionPicker({
  id,
  label,
  value,
  options,
  onChange,
  placeholder = "Select an option",
  sheetTitle,
  sheetDescription,
  hideLabel = false,
  className,
}: ExpenseOptionPickerProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.id === value);

  function handleSelect(optionId: string) {
    onChange(optionId);
    setOpen(false);
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {!hideLabel && (
        <span id={id ? `${id}-label` : undefined} className="text-sm font-medium text-foreground">
          {label}
        </span>
      )}

      <button
        type="button"
        id={id}
        aria-labelledby={!hideLabel && id ? `${id}-label` : undefined}
        aria-label={hideLabel ? label : undefined}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={cn(
          "group flex min-h-12 w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left shadow-sm",
          "border-primary/25 bg-gradient-to-r from-primary/8 via-card to-violet-500/8",
          "transition-all duration-200 hover:border-primary/45 hover:shadow-md active:scale-[0.99]",
          "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        )}
      >
        {selected ? (
          <>
            {selected.emoji ? (
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-xl"
                aria-hidden="true"
              >
                {selected.emoji}
              </span>
            ) : selected.initials ? (
              <Avatar size="sm" className="size-10">
                <AvatarFallback className="bg-primary/15 text-xs font-bold text-primary">
                  {selected.initials}
                </AvatarFallback>
              </Avatar>
            ) : null}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {selected.label}
                {selected.isCurrentUser && (
                  <span className="ml-1.5 font-normal text-muted-foreground">(you)</span>
                )}
              </p>
              {selected.description && (
                <p className={cn("mt-0.5 truncate", META_TEXT_CLASS)}>{selected.description}</p>
              )}
            </div>
          </>
        ) : (
          <p className="flex-1 text-sm text-muted-foreground">{placeholder}</p>
        )}

        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:text-foreground"
          aria-hidden="true"
        />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl border-t border-primary/20 bg-card px-0 pb-[calc(1rem+env(safe-area-inset-bottom))]"
        >
          <SheetHeader className="border-b border-border/60 px-4 pb-4 text-left">
            <SheetTitle className="font-heading text-lg font-bold">
              {sheetTitle ?? label}
            </SheetTitle>
            {sheetDescription && (
              <SheetDescription>{sheetDescription}</SheetDescription>
            )}
          </SheetHeader>

          <ul
            role="listbox"
            aria-label={sheetTitle ?? label}
            className="flex max-h-[min(24rem,60vh)] flex-col gap-1.5 overflow-y-auto px-3 py-3"
          >
            {options.map((option) => {
              const isSelected = option.id === value;

              return (
                <li key={option.id} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option.id)}
                    className={cn(
                      "flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150",
                      "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                      isSelected
                        ? "border border-primary/35 bg-gradient-to-r from-primary/15 to-violet-500/10 shadow-sm"
                        : "border border-transparent bg-muted/30 hover:border-primary/20 hover:bg-muted/50 active:scale-[0.99]",
                    )}
                  >
                    {option.emoji ? (
                      <span
                        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background text-xl"
                        aria-hidden="true"
                      >
                        {option.emoji}
                      </span>
                    ) : option.initials ? (
                      <Avatar size="sm" className="size-10">
                        <AvatarFallback
                          className={cn(
                            "text-xs font-bold",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground",
                          )}
                        >
                          {option.initials}
                        </AvatarFallback>
                      </Avatar>
                    ) : null}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {option.label}
                        {option.isCurrentUser && (
                          <span className="ml-1.5 font-normal text-muted-foreground">(you)</span>
                        )}
                      </p>
                      {option.description && (
                        <p className={cn("mt-0.5 truncate", META_TEXT_CLASS)}>
                          {option.description}
                        </p>
                      )}
                    </div>

                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border/80 bg-background/50 text-transparent",
                      )}
                      aria-hidden="true"
                    >
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </SheetContent>
      </Sheet>
    </div>
  );
}
