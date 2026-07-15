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

export function ThemeSelector() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="h-[7.5rem] animate-pulse rounded-2xl border border-border/80 bg-card"
        aria-hidden="true"
      />
    );
  }

  const activeTheme = (theme ?? "system") as ThemeValue;

  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card p-4 shadow-sm min-[375px]:p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground min-[375px]:text-[15px]">
          Appearance
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Light, dark, or match your device setting
        </p>
      </div>

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
                "flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-xs font-semibold transition-all duration-200",
                "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                selected
                  ? "border-primary/40 bg-primary/10 text-primary shadow-sm shadow-primary/10"
                  : "border-border/80 bg-background text-muted-foreground hover:border-primary/20 hover:bg-muted/50 hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg transition-colors",
                  selected ? "bg-primary/15" : "bg-muted/80",
                )}
              >
                <Icon className="size-[1.125rem]" aria-hidden="true" />
              </span>
              {label}
            </button>
          );
        })}
      </div>

      {resolvedTheme && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Active mode:{" "}
          <span className="font-medium capitalize text-foreground">
            {resolvedTheme}
          </span>
        </p>
      )}
    </div>
  );
}
