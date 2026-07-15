"use client";

import { useMemo, useState } from "react";
import { Check, ChevronRight, Coins, Search } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useCurrencyPreference } from "@/features/profile/hooks/use-currency-preference";
import {
  POPULAR_CURRENCY_CODES,
  SUPPORTED_CURRENCIES,
  type CurrencyCode,
  type CurrencyConfig,
} from "@/lib/currency";
import { cn } from "@/lib/utils";

function CurrencyOption({
  currency,
  selected,
  disabled,
  onSelect,
}: {
  currency: CurrencyConfig;
  selected: boolean;
  disabled: boolean;
  onSelect: (code: CurrencyCode) => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={() => onSelect(currency.code)}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all duration-200",
        "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-60",
        selected
          ? "border-primary/40 bg-primary/10 shadow-sm shadow-primary/10"
          : "border-border/80 bg-background hover:border-primary/20 hover:bg-muted/40",
      )}
    >
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-lg"
        aria-hidden="true"
      >
        {currency.flag}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">
          {currency.name}
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {currency.code} · {currency.symbol}
        </span>
      </span>

      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full border transition-colors",
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border/80 bg-background text-transparent",
        )}
        aria-hidden="true"
      >
        <Check className="size-3.5" />
      </span>
    </button>
  );
}

export function CurrencySelector() {
  const { currency, currencyCode, updateCurrency, isUpdating } = useCurrencyPreference();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filteredCurrencies = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) return SUPPORTED_CURRENCIES;

    return SUPPORTED_CURRENCIES.filter(
      (item) =>
        item.code.toLowerCase().includes(normalized) ||
        item.name.toLowerCase().includes(normalized) ||
        item.symbol.toLowerCase().includes(normalized),
    );
  }, [query]);

  const popularCurrencies = useMemo(
    () =>
      POPULAR_CURRENCY_CODES.map((code) =>
        SUPPORTED_CURRENCIES.find((item) => item.code === code),
      ).filter((item): item is CurrencyConfig => Boolean(item)),
    [],
  );

  function handleSelect(nextCode: CurrencyCode) {
    if (nextCode === currencyCode || isUpdating) return;

    updateCurrency(nextCode);
    setOpen(false);
    setQuery("");
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card p-4 shadow-sm min-[375px]:p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground min-[375px]:text-[15px]">
              Currency
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              How amounts appear across the app
            </p>
          </div>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Coins className="size-4" aria-hidden="true" />
          </span>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={isUpdating}
          className={cn(
            "flex w-full items-center gap-3 rounded-2xl border border-border/80 bg-background px-4 py-3.5 text-left transition-all duration-200",
            "hover:border-primary/25 hover:bg-muted/30 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-70",
          )}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-xl"
            aria-hidden="true"
          >
            {currency.flag}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-foreground">
              {currency.name}
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {currency.code} · {currency.symbol}
            </span>
          </span>

          <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          Preview:{" "}
          <span className="font-medium text-foreground">
            {currency.symbol} 1,250.50
          </span>
        </p>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[88dvh] rounded-t-3xl border-t px-0 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2"
        >
          <SheetHeader className="border-b border-border/60 px-4 pb-4 text-left">
            <SheetTitle className="text-base font-semibold">Choose currency</SheetTitle>
            <SheetDescription>
              Applies to balances, expenses, and settlements on this device.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 overflow-y-auto px-4 py-4">
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search currency or code"
                className="h-11 rounded-xl border-border/80 bg-background pl-9"
                aria-label="Search currencies"
              />
            </div>

            {!query.trim() && (
              <div>
                <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Popular
                </p>
                <div className="flex flex-wrap gap-2">
                  {popularCurrencies.map((item) => {
                    const selected = item.code === currencyCode;

                    return (
                      <button
                        key={item.code}
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleSelect(item.code)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                          selected
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : "border-border/80 bg-background text-muted-foreground hover:border-primary/20 hover:text-foreground",
                        )}
                      >
                        <span aria-hidden="true">{item.flag}</span>
                        {item.code}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div
              className="space-y-2"
              role="radiogroup"
              aria-label="Supported currencies"
            >
              {filteredCurrencies.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted-foreground">
                  No currencies match your search.
                </p>
              ) : (
                filteredCurrencies.map((item) => (
                  <CurrencyOption
                    key={item.code}
                    currency={item}
                    selected={item.code === currencyCode}
                    disabled={isUpdating}
                    onSelect={handleSelect}
                  />
                ))
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
