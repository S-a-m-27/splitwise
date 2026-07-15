export { BalanceEngine, recalculateBalances } from "@/features/balances/engine/balance-engine";

export { calculateEqualSplit, equalSplitStrategy } from "@/features/balances/engine/equal-split";
export {
  calculateExpenseShares,
  calculateExpenseRelationships,
  calculateExpenseResult,
  defaultSplitStrategyRegistry,
} from "@/features/balances/engine/expense-shares";
export {
  calculateNetBalances,
  calculateUserBalance,
  aggregateRelationships,
  normalizeBalances,
  mergeNetBalances,
  toUserBalances,
  applyExpenseToNetBalances,
} from "@/features/balances/engine/net-balances";
export {
  simplifyDebtsFromNetBalances,
  simplifyDebtChains,
  calculateRelationshipsFromNets,
} from "@/features/balances/engine/debt-simplification";
export {
  applySettlementToNetBalances,
  applySettlementsToNetBalances,
  calculateSettlementImpact,
  calculateGroupBalances,
  relationshipsToNetBalances,
} from "@/features/balances/engine/settlement-calculator";
export {
  calculateDashboardSummary,
  calculateExpenseResults,
  calculateUserBalanceInGroup,
} from "@/features/balances/engine/balance-calculator";

export {
  validateExpenseInput,
  validateExpenses,
  validateSettlementInput,
  validateSettlements,
} from "@/features/balances/engine/validators";

export {
  cents,
  dollarsToCents,
  centsToDollars,
  distributeCentsEvenly,
  sumCents,
  roundDollarsToCents,
} from "@/features/balances/engine/rounding";

export { BalanceEngineError, assertBalanceEngine } from "@/features/balances/engine/errors";

export type {
  SplitStrategy,
  SplitStrategyRegistry,
} from "@/features/balances/engine/split-strategy";
export { createSplitStrategyRegistry, resolveSplitStrategy } from "@/features/balances/engine/split-strategy";

export type {
  UserId,
  GroupId,
  ExpenseId,
  SettlementId,
  SplitType,
  Cents,
  Money,
  ExpenseInput,
  SettlementInput,
  ValidatedExpense,
  ParticipantShare,
  ExpenseShareResult,
  DebtRelationship,
  UserBalance,
  GroupBalanceResult,
  DashboardSummary,
  GroupDashboardSummary,
  BalanceEngineInput,
  BalanceEngineResult,
  SettlementImpact,
} from "@/features/balances/engine/types";
