"use client";

import { Search, X } from "lucide-react";
import { ConversationAvatar } from "@/features/chat/components/conversation-avatar";
import { useConversationSearch } from "@/features/chat/hooks/use-conversation-search";
import type { ConversationSearchResult } from "@/features/chat/types/ui";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface ConversationSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (result: ConversationSearchResult) => void;
  className?: string;
}

export function ConversationSearch({
  value,
  onChange,
  onSelect,
  className,
}: ConversationSearchProps) {
  const { results, recentSearches, isLoading, isEmpty, hasQuery } =
    useConversationSearch(value);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search conversations, people, groups…"
          aria-label="Search conversations"
          className={cn(
            "h-11 w-full rounded-xl border border-border/80 bg-card pl-10 pr-10 text-sm shadow-sm",
            "placeholder:text-muted-foreground/70",
            "focus-visible:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
            "min-[375px]:h-12 min-[375px]:rounded-2xl",
          )}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {!hasQuery && recentSearches.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Recent searches
          </p>
          <ul className="flex flex-wrap gap-2">
            {recentSearches.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onChange(item.query)}
                  className="rounded-full border border-border/80 bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                >
                  {item.query}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasQuery && isLoading && (
        <p className={cn("py-6 text-center text-sm", META_TEXT_CLASS)} role="status">
          Searching…
        </p>
      )}

      {hasQuery && !isLoading && isEmpty && (
        <p className={cn("py-6 text-center text-sm", META_TEXT_CLASS)} role="status">
          No results for &ldquo;{value}&rdquo;
        </p>
      )}

      {hasQuery && !isLoading && results.length > 0 && (
        <ul className="flex flex-col gap-2" role="listbox" aria-label="Search results">
          {results.map((result) => (
            <li key={result.id}>
              <button
                type="button"
                role="option"
                aria-selected="false"
                onClick={() => onSelect?.(result)}
                className="flex w-full min-h-11 items-center gap-3 rounded-xl border border-border/60 bg-card px-3 py-2.5 text-left hover:bg-muted/50"
              >
                <ConversationAvatar
                  type={result.type === "group" ? "group" : "direct"}
                  title={result.title}
                  avatarIcon={result.avatarIcon}
                  avatarUrl={result.avatarUrl}
                  initials={result.initials}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{result.title}</p>
                  {result.subtitle && (
                    <p className={cn("truncate text-xs", META_TEXT_CLASS)}>{result.subtitle}</p>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
