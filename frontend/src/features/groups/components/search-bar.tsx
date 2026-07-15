"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  onFilterClick?: () => void;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search groups…",
  ariaLabel = "Search",
  onFilterClick,
  className,
}: SearchBarProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative min-w-0 flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-label={ariaLabel}
          className="h-11 pl-9 text-sm min-[375px]:h-11"
        />
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-11 shrink-0"
        aria-label="Filter groups (coming soon)"
        onClick={onFilterClick}
      >
        <SlidersHorizontal className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
