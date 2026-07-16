import { describe, expect, it } from "vitest";
import { formatTypingUsers } from "@/features/chat/utils/format-typing-users";

describe("formatTypingUsers", () => {
  it("formats one, two, and many users accessibly", () => {
    expect(formatTypingUsers(["Ahmed"])).toBe("Ahmed is typing…");
    expect(formatTypingUsers(["Ahmed", "Ali"])).toBe(
      "Ahmed and Ali are typing…",
    );
    expect(formatTypingUsers(["Ahmed", "Ali", "Sara"])).toBe(
      "3 people are typing…",
    );
  });

  it("deduplicates names and returns null for an empty list", () => {
    expect(formatTypingUsers(["Ahmed", "Ahmed"])).toBe("Ahmed is typing…");
    expect(formatTypingUsers([])).toBeNull();
  });
});
