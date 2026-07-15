import { recalculateBalances } from "@/features/balances/engine/balance-calculator";
import { calculateSettlementImpact } from "@/features/balances/engine/settlement-calculator";
import type { SplitStrategyRegistry } from "@/features/balances/engine/split-strategy";
import { defaultSplitStrategyRegistry } from "@/features/balances/engine/expense-shares";
import type {
  BalanceEngineInput,
  BalanceEngineResult,
  SettlementInput,
} from "@/features/balances/engine/types";

/**
 * Primary facade for the balance domain engine.
 * Stateless — all methods are pure and return new immutable results.
 */
export const BalanceEngine = {
  recalculate(
    input: BalanceEngineInput,
    registry: SplitStrategyRegistry = defaultSplitStrategyRegistry,
  ): BalanceEngineResult {
    return recalculateBalances(input, registry);
  },

  settlementImpact(
    relationships: BalanceEngineResult["overallRelationships"],
    settlement: SettlementInput,
  ) {
    return calculateSettlementImpact(relationships, settlement);
  },
} as const;

export { recalculateBalances };
