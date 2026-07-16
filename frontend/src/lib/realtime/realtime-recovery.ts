export interface RealtimeRecoveryDecision {
  needsRecovery: boolean;
  shouldRecover: boolean;
}

const DISCONNECTED_STATUSES = new Set([
  "CHANNEL_ERROR",
  "TIMED_OUT",
  "CLOSED",
]);

export function evaluateRealtimeRecovery(
  needsRecovery: boolean,
  status: string,
): RealtimeRecoveryDecision {
  if (DISCONNECTED_STATUSES.has(status)) {
    return { needsRecovery: true, shouldRecover: false };
  }

  if (status === "SUBSCRIBED" && needsRecovery) {
    return { needsRecovery: false, shouldRecover: true };
  }

  return { needsRecovery, shouldRecover: false };
}
