import { describe, expect, it } from "vitest";
import {
  formatAmountInputDisplay,
  sanitizeAmountInput,
} from "@/features/expenses/utils/format-amount-input";

describe("format amount input", () => {
  it("strips non-numeric characters except a single decimal", () => {
    expect(sanitizeAmountInput("2,000,000")).toBe("2000000");
    expect(sanitizeAmountInput("12.345")).toBe("12.34");
    expect(sanitizeAmountInput("rs 1a2b")).toBe("12");
  });

  it("formats with thousand separators", () => {
    expect(formatAmountInputDisplay("2000000")).toBe("2,000,000");
    expect(formatAmountInputDisplay("1234.5")).toBe("1,234.5");
    expect(formatAmountInputDisplay("12.")).toBe("12.");
  });
});
