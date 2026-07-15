"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

type ThemeValue = (typeof THEME_OPTIONS)[number]["value"];

interface ThemeToggleProps {
  /** Compact icon-only row for nav bars; default card for menus. */
  variant?: "compact" | "menu";
  className?: string;
}

export function ThemeToggle({ variant = "compact", className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          "animate-pulse rounded-xl bg-muted/80",
          variant === "compact" ? "size-11 md:h-9 md:w-[7.5rem]" : "h-12 w-full",
          className,
        )}
        aria-hidden="true"
      />
    );
  }

  const activeTheme = (theme ?? "system") as ThemeValue;

  if (variant === "menu") {
    return (
      <div className={cn("px-4 py-3", className)}>
        <p className="mb-2 px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Appearance
        </p>
        <div
          className="grid grid-cols-3 gap-2"
          role="radiogroup"
          aria-label="Color theme"
        >
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
            const selected = activeTheme === value;

            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setTheme(value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs font-semibold transition-all",
                  "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  selected
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/80 bg-background text-muted-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-xl border border-border/80 bg-background/80 p-1",
        className,
      )}
      role="radiogroup"
      aria-label="Color theme"
    >
      {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
        const selected = activeTheme === value;

        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-lg transition-all duration-200",
              "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              "md:size-8",
              selected
                ? "bg-primary/15 text-primary shadow-sm"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
