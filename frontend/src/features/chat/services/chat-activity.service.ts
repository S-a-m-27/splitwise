import type { ChatRealtimeGateway } from "@/features/chat/services/chat-contracts";

const TYPING_HEARTBEAT_MS = 2_000;
const TYPING_IDLE_MS = 3_500;

interface OutboundTypingState {
  active: boolean;
  lastSentAt: number;
  idleTimer: ReturnType<typeof setTimeout> | null;
}

export class ChatActivityService {
  private readonly typing = new Map<string, OutboundTypingState>();

  constructor(private readonly realtime: ChatRealtimeGateway) {}

  notifyTyping(conversationId: string, userId: string): void {
    const state = this.typing.get(conversationId) ?? {
      active: false,
      lastSentAt: 0,
      idleTimer: null,
    };
    if (state.idleTimer) clearTimeout(state.idleTimer);

    const now = Date.now();
    if (!state.active || now - state.lastSentAt >= TYPING_HEARTBEAT_MS) {
      state.active = true;
      state.lastSentAt = now;
      void this.realtime
        .broadcastTyping(conversationId, userId, true)
        .catch(() => {
          const current = this.typing.get(conversationId);
          if (current === state) {
            state.active = false;
            state.lastSentAt = 0;
          }
        });
    }

    state.idleTimer = setTimeout(() => {
      void this.stopTyping(conversationId, userId);
    }, TYPING_IDLE_MS);
    this.typing.set(conversationId, state);
  }

  async stopTyping(conversationId: string, userId: string): Promise<void> {
    const state = this.typing.get(conversationId);
    if (!state) return;
    if (state.idleTimer) clearTimeout(state.idleTimer);
    this.typing.delete(conversationId);
    if (!state.active) return;
    await this.realtime
      .broadcastTyping(conversationId, userId, false)
      .catch(() => undefined);
  }

  clear(conversationId: string): void {
    const state = this.typing.get(conversationId);
    if (state?.idleTimer) clearTimeout(state.idleTimer);
    this.typing.delete(conversationId);
  }
}
