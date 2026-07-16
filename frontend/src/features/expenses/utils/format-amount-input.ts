/**
 * Normalize typed amount input to a raw numeric string (digits + optional one decimal).
 */
export function sanitizeAmountInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const [whole = "", ...fractionParts] = cleaned.split(".");
  if (fractionParts.length === 0) return whole;
  return `${whole}.${fractionParts.join("").slice(0, 2)}`;
}

/**
 * Display helper: thousand separators on the integer part; keeps decimals as typed.
 */
export function formatAmountInputDisplay(value: string): string {
  if (!value) return "";

  const [wholePart = "", fractionPart] = value.split(".");
  const normalizedWhole = wholePart.replace(/^0+(?=\d)/, "") || (value.startsWith("0") ? "0" : "");
  const withSeparators = normalizedWhole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  if (fractionPart !== undefined) {
    return `${withSeparators || "0"}.${fractionPart.slice(0, 2)}`;
  }

  // Preserve a trailing decimal while the user is typing "12."
  if (value.endsWith(".") && !value.slice(0, -1).includes(".")) {
    return `${withSeparators}.`;
  }

  return withSeparators;
}
