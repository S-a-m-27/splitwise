import { Users } from "lucide-react";

/** Decorative app preview shown beside the hero headline (not interactive). */
export function HeroMockup() {
  return (
    <div
      className="animate-float relative mx-auto w-full max-w-sm lg:max-w-md"
      aria-hidden="true"
    >
      {/* Floating color accents for depth behind the card */}
      <div
        className="animate-blob absolute -top-10 -left-8 -z-10 size-32 rounded-full bg-[color-mix(in_oklch,var(--gradient-glow)_25%,transparent)] blur-2xl"
        aria-hidden="true"
      />
      <div
        className="animate-float-slow absolute -right-6 -bottom-6 -z-10 size-28 rounded-full bg-[color-mix(in_oklch,var(--gradient-glow-secondary)_25%,transparent)] blur-2xl"
        aria-hidden="true"
      />

      <div className="gradient-card card-glow rounded-2xl border p-4 shadow-lg shadow-primary/10">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Weekend Trip</p>
            <p className="text-lg font-semibold">$284.50</p>
            <div className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground">
              <Users className="size-3" />
              <span>4 members</span>
            </div>
          </div>
          <div className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary ring-1 ring-primary/15">
            All settled
          </div>
        </div>

        <div className="mb-3 flex -space-x-2">
          {["You", "Alex", "Sam", "+1"].map((member) => (
            <span
              key={member}
              className="flex size-7 items-center justify-center rounded-full border-2 border-card bg-accent text-[9px] font-bold"
            >
              {member === "+1" ? "+1" : member[0]}
            </span>
          ))}
        </div>

        <div className="space-y-2">
          <MockExpense label="Airbnb" amount="$180.00" payer="You" split="Equal" />
          <MockExpense label="Groceries" amount="$64.50" payer="Alex" split="Equal" />
          <MockExpense label="Gas" amount="$40.00" payer="Sam" split="Equal" />
        </div>

        <div className="mt-4 rounded-xl border border-primary/10 bg-accent/40 p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Your balance
          </p>
          <div className="flex items-center justify-between text-sm">
            <span>Alex owes you</span>
            <span className="font-semibold text-primary">$21.50</span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
            <div className="animate-grow-bar h-full w-3/4 rounded-full bg-primary/60" />
          </div>
        </div>
      </div>

      <div className="absolute -right-2 -bottom-2 -z-10 size-full rounded-2xl bg-primary/10" />
    </div>
  );
}

function MockExpense({
  label,
  amount,
  payer,
  split,
}: {
  label: string;
  amount: string;
  payer: string;
  split: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-background/80 px-3 py-2.5 transition-colors hover:border-primary/15">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          Paid by {payer} · {split}
        </p>
      </div>
      <p className="text-sm font-semibold tabular-nums">{amount}</p>
    </div>
  );
}
