import { describe, expect, it } from "vitest";
import { ROUTES } from "@/constants/routes";
import { DASHBOARD_NAV_ITEMS, resolveNavHref } from "@/features/dashboard/constants/nav-items";

describe("dashboard nav hrefs", () => {
  it("defines valid routes for every nav item", () => {
    expect(ROUTES.chat).toBe("/chat");

    for (const item of DASHBOARD_NAV_ITEMS) {
      const href = resolveNavHref(item);
      expect(href, `nav item ${item.id}`).toBeTypeOf("string");
      expect(href.length, `nav item ${item.id}`).toBeGreaterThan(0);
    }
  });
});
