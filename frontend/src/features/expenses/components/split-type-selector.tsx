"use client";

import { SPLIT_TYPE_OPTIONS } from "@/features/expenses/constants/split-types";
import type { SplitType } from "@/features/expenses/types";
import { cn } from "@/lib/utils";

interface SplitTypeSelectorProps {
  value: SplitType;
  onChange: (splitType: SplitType) => void;
  disabled?: boolean;
  className?: string;
}

export function SplitTypeSelector({
  value,
  onChange,
  disabled = false,
  className,
}: SplitTypeSelectorProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
        Split method
      </p>
      <div className="-mx-0.5 flex gap-2 overflow-x-auto px-0.5 pb-0.5 scrollbar-none">
        {SPLIT_TYPE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.id;

          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.id)}
              aria-pressed={isSelected}
              className={cn(
                "flex min-h-10 shrink-0 items-center gap-2 rounded-xl border px-3 py-2 transition-all duration-200",
                "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                "disabled:pointer-events-none disabled:opacity-50",
                isSelected
                  ? "border-primary/50 bg-primary/15 text-primary shadow-sm shadow-primary/10"
                  : "border-border/70 bg-background/50 text-foreground hover:border-primary/30 hover:bg-muted/40 active:scale-[0.98]",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span className="text-sm font-semibold">{option.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
