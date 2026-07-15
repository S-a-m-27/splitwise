import type { ParticipantShare, SplitType, ValidatedExpense } from "@/features/balances/engine/types";

/**
 * Extension point for future split strategies.
 * New strategies implement this interface and register with the engine.
 */
export interface SplitStrategy {
  readonly type: SplitType;
  calculateShares(expense: ValidatedExpense): readonly ParticipantShare[];
}

export type SplitStrategyRegistry = ReadonlyMap<SplitType, SplitStrategy>;

export function createSplitStrategyRegistry(
  strategies: readonly SplitStrategy[],
): SplitStrategyRegistry {
  const registry = new Map<SplitType, SplitStrategy>();
  for (const strategy of strategies) {
    registry.set(strategy.type, strategy);
  }
  return registry;
}

export function resolveSplitStrategy(
  registry: SplitStrategyRegistry,
  splitType: SplitType,
): SplitStrategy {
  const strategy = registry.get(splitType);
  if (!strategy) {
    throw new Error(`No split strategy registered for type: ${splitType}`);
  }
  return strategy;
}
