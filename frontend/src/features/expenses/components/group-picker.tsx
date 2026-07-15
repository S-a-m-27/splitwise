"use client";

import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

export interface GroupPickerOption {
  id: string;
  name: string;
  icon: string;
}

interface GroupPickerProps {
  groups: GroupPickerOption[];
  value: string;
  onChange: (groupId: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function GroupPicker({
  groups,
  value,
  onChange,
  isLoading = false,
  className,
}: GroupPickerProps) {
  const displayGroups = groups;

  if (isLoading) {
    return (
      <div className={cn("flex flex-col gap-2.5", className)}>
        <p className="text-sm font-medium text-foreground">Group</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-11 w-36 shrink-0 animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
      </div>
    );
  }

  if (displayGroups.length === 0) {
    return (
      <div className={cn("rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-3", className)}>
        <p className="text-sm font-medium text-foreground">No groups yet</p>
        <p className={cn("mt-1", META_TEXT_CLASS)}>
          Create a group first to add expenses.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <p className="text-sm font-medium text-foreground">Group</p>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
        {displayGroups.map((group) => {
          const isSelected = value === group.id;

          return (
            <button
              key={group.id}
              type="button"
              onClick={() => onChange(group.id)}
              aria-pressed={isSelected}
              className={cn(
                "flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-3 py-2.5 transition-all duration-200",
                "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                isSelected
                  ? "border-primary/50 bg-gradient-to-r from-primary/15 via-primary/8 to-violet-500/10 shadow-md shadow-primary/10"
                  : "border-border/80 bg-card/80 hover:border-primary/25 hover:bg-muted/40 active:scale-[0.98]",
              )}
            >
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg text-lg transition-transform duration-200",
                  isSelected ? "scale-110 bg-primary/15" : "bg-muted",
                )}
                aria-hidden="true"
              >
                {group.icon}
              </span>
              <span className="max-w-[8.5rem] truncate text-left">
                <span className="block text-sm font-semibold text-foreground">{group.name}</span>
                <span className={cn("block", META_TEXT_CLASS)}>
                  {isSelected ? "Selected" : "Tap to select"}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
