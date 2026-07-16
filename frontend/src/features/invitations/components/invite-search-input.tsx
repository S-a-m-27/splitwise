"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface InviteSearchInputProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onClear?: () => void;
  readonly className?: string;
  readonly id?: string;
}

export function InviteSearchInput({
  value,
  onChange,
  onClear,
  className,
  id = "invite-search",
}: InviteSearchInputProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={id} className="sr-only">
        Search by name or email
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          id={id}
          type="search"
          inputMode="search"
          autoComplete="off"
          placeholder="Search by name or email"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 rounded-xl border-border/80 bg-card pr-10 pl-10 text-base shadow-sm"
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      <p className={cn("px-1", META_TEXT_CLASS)}>
        Search for registered members or enter an email to invite someone new.
      </p>
    </div>
  );
}
