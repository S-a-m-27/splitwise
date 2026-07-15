import type { Cents } from "@/features/balances/engine/types";
import { assertBalanceEngine } from "@/features/balances/engine/errors";

/** Creates a validated cents value. */
export function cents(value: number): Cents {
  assertBalanceEngine(
    Number.isInteger(value),
    "INVALID_AMOUNT",
    "Money must be represented as integer cents.",
  );
  return value;
}

/** Converts a decimal dollar amount to cents (for test fixtures). */
export function dollarsToCents(amount: number): Cents {
  return cents(Math.round(amount * 100));
}

/** Converts cents to dollars (for assertions in tests). */
export function centsToDollars(amountCents: Cents): number {
  return amountCents / 100;
}

/**
 * Distributes `totalCents` evenly across `count` participants.
 * Remainder pennies are assigned to the first `remainder` participants (+1 cent each).
 * Guarantees sum(shares) === totalCents.
 */
export function distributeCentsEvenly(totalCents: Cents, count: number): readonly Cents[] {
  assertBalanceEngine(count > 0, "EMPTY_PARTICIPANTS", "Participant count must be greater than zero.");
  assertBalanceEngine(totalCents >= 0, "INVALID_AMOUNT", "Amount must be non-negative.");

  const base = Math.floor(totalCents / count);
  const remainder = totalCents % count;

  return Array.from({ length: count }, (_, index) =>
    cents(base + (index < remainder ? 1 : 0)),
  );
}

/** Sums an array of cent values. */
export function sumCents(values: readonly Cents[]): Cents {
  return cents(values.reduce((sum, value) => sum + value, 0));
}

/** Absolute value for cents. */
export function absCents(value: Cents): Cents {
  return cents(Math.abs(value));
}

/** Rounds a dollar float to cents — only for boundary input conversion, not internal math. */
export function roundDollarsToCents(amount: number): Cents {
  assertBalanceEngine(
    Number.isFinite(amount),
    "INVALID_AMOUNT",
    "Amount must be a finite number.",
  );
  return cents(Math.round(amount * 100));
}
