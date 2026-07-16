"use client";

import { useCurrency } from "@/hooks/use-currency";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AmountInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  variant?: "default" | "hero";
  "aria-invalid"?: boolean;
  className?: string;
}

export function AmountInput({
  id = "expense-amount",
  value,
  onChange,
  placeholder = "0.00",
  variant = "default",
  "aria-invalid": ariaInvalid,
  className,
}: AmountInputProps) {
  const { symbol } = useCurrency();
  const isHero = variant === "hero";
  const hasValue = value.trim().length > 0;

  if (isHero) {
    return (
      <div className={cn("group relative", className)}>
        <div
          className="pointer-events-none absolute -inset-1 rounded-[1.35rem] bg-gradient-to-r from-primary/25 via-violet-500/15 to-primary/25 opacity-0 blur-md transition-opacity duration-300 group-focus-within:opacity-100"
          aria-hidden="true"
        />

        <div
          className={cn(
            "relative flex min-h-[4.25rem] items-center gap-3 rounded-2xl border border-primary/20 bg-background/80 px-3.5 py-3 shadow-inner backdrop-blur-sm transition-all duration-200",
            "group-focus-within:border-primary/40 group-focus-within:bg-background group-focus-within:shadow-md group-focus-within:shadow-primary/10",
            "min-[375px]:min-h-[4.75rem] min-[375px]:gap-3.5 min-[375px]:px-4",
          )}
        >
          <span
            className={cn(
              "flex shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 font-bold text-primary",
              "min-w-[2.75rem] px-2 py-1.5 text-base min-[375px]:min-w-[3rem] min-[375px]:text-lg",
            )}
            aria-hidden="true"
          >
            {symbol}
          </span>

          <Input
            id={id}
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(event) => {
              const next = event.target.value.replace(/[^\d.]/g, "");
              onChange(next);
            }}
            placeholder={placeholder}
            aria-invalid={ariaInvalid}
            className={cn(
              "h-auto min-h-[2.5rem] flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0",
              "font-bold tabular-nums tracking-tight text-foreground placeholder:text-foreground/25",
              "text-right text-3xl min-[375px]:min-h-[2.75rem] min-[375px]:text-4xl",
              hasValue && "text-gradient-primary",
            )}
            autoComplete="off"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative flex items-center", className)}>
      <span
        className="shrink-0 pl-1 text-base font-bold text-muted-foreground"
        aria-hidden="true"
      >
        {symbol}
      </span>
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(event) => {
          const next = event.target.value.replace(/[^\d.]/g, "");
          onChange(next);
        }}
        placeholder={placeholder}
        aria-invalid={ariaInvalid}
        className={cn(
          "h-12 border-0 bg-transparent pl-1 shadow-none focus-visible:ring-0",
          "text-lg font-bold tabular-nums text-foreground min-[375px]:text-xl",
        )}
        autoComplete="off"
      />
    </div>
  );
}
