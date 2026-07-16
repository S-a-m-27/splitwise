const DEFAULT_ECHO_TTL_MS = 10_000;
const MAX_PENDING_ECHOES = 1_000;
const pendingEchoes = new Map<string, number>();

function echoKey(table: string, clientEventId: string): string {
  return `${table}:${clientEventId}`;
}

function pruneExpired(now: number) {
  for (const [key, expiresAt] of pendingEchoes) {
    if (expiresAt < now) pendingEchoes.delete(key);
  }
  while (pendingEchoes.size >= MAX_PENDING_ECHOES) {
    const oldestKey = pendingEchoes.keys().next().value as string | undefined;
    if (!oldestKey) break;
    pendingEchoes.delete(oldestKey);
  }
}

export function registerRealtimeEcho(
  table: string,
  clientEventId: string,
  ttlMs = DEFAULT_ECHO_TTL_MS,
  now = Date.now(),
) {
  pruneExpired(now);
  pendingEchoes.set(echoKey(table, clientEventId), now + ttlMs);
}

export function consumeRealtimeEcho(
  table: string,
  clientEventId: string,
  now = Date.now(),
): boolean {
  pruneExpired(now);
  const key = echoKey(table, clientEventId);
  const expiresAt = pendingEchoes.get(key);
  if (expiresAt === undefined) return false;

  pendingEchoes.delete(key);
  return expiresAt >= now;
}

export function clearRealtimeEchoRegistry() {
  pendingEchoes.clear();
}
