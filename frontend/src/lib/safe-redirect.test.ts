import { describe, expect, it } from "vitest";
import { getSafeRedirect } from "@/lib/safe-redirect";
import { ROUTES } from "@/constants/routes";

describe("getSafeRedirect", () => {
  it("allows relative app paths with query strings", () => {
    expect(getSafeRedirect("/expenses/new?groupId=abc")).toBe(
      "/expenses/new?groupId=abc",
    );
  });

  it("rejects the marketing home path so auth falls through to dashboard", () => {
    expect(getSafeRedirect("/")).toBeNull();
  });

  it("rejects protocol-relative and backslash open-redirect tricks", () => {
    expect(getSafeRedirect("//evil.com")).toBeNull();
    expect(getSafeRedirect("/\\evil.com")).toBeNull();
    expect(getSafeRedirect("/%5cevil.com")).toBeNull();
  });

  it("rejects auth routes unless explicitly allowed", () => {
    expect(getSafeRedirect(ROUTES.login)).toBeNull();
    expect(getSafeRedirect(ROUTES.resetPassword)).toBeNull();
    expect(
      getSafeRedirect(ROUTES.resetPassword, {
        allowPaths: [ROUTES.resetPassword],
      }),
    ).toBe(ROUTES.resetPassword);
  });
});
