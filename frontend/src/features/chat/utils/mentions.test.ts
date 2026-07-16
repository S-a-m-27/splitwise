import { describe, expect, it } from "vitest";
import {
  buildMentionSegments,
  findActiveMention,
  insertMention,
} from "@/features/chat/utils/mentions";

describe("chat mentions", () => {
  it("finds and inserts an active mention at the cursor", () => {
    const active = findActiveMention("Hello @kha", 10);
    expect(active).toEqual({ start: 6, end: 10, query: "kha" });
    expect(insertMention("Hello @kha", active!, "Khanwaiz")).toEqual({
      value: "Hello @Khanwaiz ",
      cursorPosition: 16,
    });
  });

  it("highlights only persisted mention labels", () => {
    expect(
      buildMentionSegments("Hi @Khanwaiz and @Sohaib", ["Khanwaiz"]),
    ).toEqual([
      { text: "Hi ", mentioned: false },
      { text: "@Khanwaiz", mentioned: true },
      { text: " and @Sohaib", mentioned: false },
    ]);
  });
});
