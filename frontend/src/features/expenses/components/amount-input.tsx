import { CURRENCY } from "@/lib/currency";
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
  const isHero = variant === "hero";

  return (
    <div className={cn("relative", isHero && "group", className)}>
      {isHero && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 via-violet-500/10 to-primary/20 opacity-0 blur-xl transition-opacity duration-300 group-focus-within:opacity-100"
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          "relative flex items-center",
          isHero &&
            "rounded-2xl border border-primary/30 bg-background/50 px-4 py-3 shadow-inner backdrop-blur-sm transition-all duration-200 group-focus-within:border-primary/50 group-focus-within:shadow-lg group-focus-within:shadow-primary/10 min-[375px]:px-5 min-[375px]:py-3.5",
        )}
      >
        <span
          className={cn(
            "shrink-0 font-bold text-muted-foreground",
            isHero ? "text-2xl min-[375px]:text-3xl" : "text-base",
          )}
          aria-hidden="true"
        >
          {CURRENCY.symbol}
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
            "border-0 bg-transparent px-2 shadow-none focus-visible:ring-0",
            "font-bold tabular-nums text-foreground",
            isHero
              ? "h-14 text-3xl min-[375px]:h-16 min-[375px]:text-4xl"
              : "h-12 pl-1 text-lg min-[375px]:text-xl",
          )}
          autoComplete="off"
        />
      </div>
    </div>
  );
}
