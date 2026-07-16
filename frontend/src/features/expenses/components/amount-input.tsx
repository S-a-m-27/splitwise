"use client";

import { useCurrency } from "@/hooks/use-currency";
import { Input } from "@/components/ui/input";
import {
  formatAmountInputDisplay,
  sanitizeAmountInput,
} from "@/features/expenses/utils/format-amount-input";
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
  const displayValue = formatAmountInputDisplay(value);

  function handleChange(nextRaw: string) {
    onChange(sanitizeAmountInput(nextRaw));
  }

  if (isHero) {
    return (
      <div className={cn("group relative", className)}>
        <div
          className="pointer-events-none absolute -inset-1 rounded-[1.35rem] bg-gradient-to-r from-primary/25 via-violet-500/15 to-primary/25 opacity-0 blur-md transition-opacity duration-300 group-focus-within:opacity-100"
          aria-hidden="true"
        />

        <div
          className={cn(
            "relative flex min-h-[5.5rem] items-center gap-3 rounded-2xl border border-primary/25 bg-background/80 px-4 py-4 shadow-inner backdrop-blur-sm transition-all duration-200",
            "group-focus-within:border-primary/45 group-focus-within:bg-background group-focus-within:shadow-lg group-focus-within:shadow-primary/10",
            "min-[375px]:min-h-[6.5rem] min-[375px]:gap-4 min-[375px]:px-5",
            "md:min-h-[7.5rem] md:px-6",
          )}
        >
          <span
            className={cn(
              "flex shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 font-bold text-primary",
              "min-w-[3.25rem] px-2.5 py-2 text-xl min-[375px]:min-w-[3.75rem] min-[375px]:text-2xl",
              "md:min-w-[4.25rem] md:text-3xl",
            )}
            aria-hidden="true"
          >
            {symbol}
          </span>

          {/* Native input — avoids shared Input's md:text-sm which shrinks hero amounts on desktop */}
          <input
            id={id}
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={(event) => handleChange(event.target.value)}
            placeholder={placeholder}
            aria-invalid={ariaInvalid}
            autoComplete="off"
            className={cn(
              "h-auto min-h-[3.5rem] w-full min-w-0 flex-1 border-0 bg-transparent p-0 text-right outline-none",
              "font-bold tabular-nums tracking-tight text-foreground placeholder:text-foreground/25",
              // Fluid size: readable on phone, clearly large on desktop
              "text-[clamp(2.5rem,6vw,4.5rem)] leading-none",
              hasValue && "text-gradient-primary",
            )}
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
        value={displayValue}
        onChange={(event) => handleChange(event.target.value)}
        placeholder={placeholder}
        aria-invalid={ariaInvalid}
        className={cn(
          "h-12 border-0 bg-transparent pl-1 shadow-none focus-visible:ring-0 dark:bg-transparent",
          "text-xl font-bold tabular-nums text-foreground min-[375px]:text-2xl md:!text-2xl",
        )}
        autoComplete="off"
      />
    </div>
  );
}
