import { afterEach, describe, expect, it, vi } from "vitest";
import { ChatActivityService } from "@/features/chat/services/chat-activity.service";
import type { ChatRealtimeGateway } from "@/features/chat/services/chat-contracts";

function gateway(broadcastTyping: ChatRealtimeGateway["broadcastTyping"]): ChatRealtimeGateway {
  return {
    subscribeToConversation: () => {
      throw new Error("not used");
    },
    subscribeToConversationActivity: () => {
      throw new Error("not used");
    },
    subscribeToInbox: () => {
      throw new Error("not used");
    },
    broadcastTyping,
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("ChatActivityService", () => {
  it("deduplicates typing events and stops after inactivity", async () => {
    vi.useFakeTimers();
    const broadcastTyping = vi.fn(async () => undefined);
    const service = new ChatActivityService(gateway(broadcastTyping));

    service.notifyTyping("conversation", "user");
    service.notifyTyping("conversation", "user");
    expect(broadcastTyping).toHaveBeenCalledTimes(1);
    expect(broadcastTyping).toHaveBeenLastCalledWith(
      "conversation",
      "user",
      true,
    );

    await vi.advanceTimersByTimeAsync(3_500);
    expect(broadcastTyping).toHaveBeenLastCalledWith(
      "conversation",
      "user",
      false,
    );
  });

  it("stops immediately when requested", async () => {
    const broadcastTyping = vi.fn(async () => undefined);
    const service = new ChatActivityService(gateway(broadcastTyping));
    service.notifyTyping("conversation", "user");
    await service.stopTyping("conversation", "user");
    expect(broadcastTyping).toHaveBeenLastCalledWith(
      "conversation",
      "user",
      false,
    );
  });

  it("retries immediately after a failed typing broadcast", async () => {
    const broadcastTyping = vi
      .fn<ChatRealtimeGateway["broadcastTyping"]>()
      .mockRejectedValueOnce(new Error("channel unavailable"))
      .mockResolvedValue(undefined);
    const service = new ChatActivityService(gateway(broadcastTyping));

    service.notifyTyping("conversation", "user");
    await Promise.resolve();
    await Promise.resolve();
    service.notifyTyping("conversation", "user");

    expect(broadcastTyping).toHaveBeenCalledTimes(2);
  });
});
