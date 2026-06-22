import { describe, expect, test } from "bun:test";
import { activeRailIdForPath, footerRailItems, primaryRailItems } from "./side-rail";

describe("side rail navigation", () => {
  test("keeps every icon-only rail target named", () => {
    const labels = [...primaryRailItems, ...footerRailItems].map((item) => item.label);

    expect(labels).toEqual([
      "Home",
      "Repositories",
      "Inbox",
      "Actions",
      "Releases",
      "Site admin",
      "Account",
      "Settings",
    ]);
  });

  test("treats repository workbench pages as repository navigation", () => {
    expect(activeRailIdForPath("/repos")).toBe("repos");
    expect(activeRailIdForPath("/new")).toBe("repos");
    expect(activeRailIdForPath("/r/comtrya/dogfood")).toBe("repos");
    expect(activeRailIdForPath("/r/comtrya/dogfood/docs")).toBe("repos");
  });

  test("marks account and instance settings in the footer rail", () => {
    expect(activeRailIdForPath("/account/git-tokens")).toBe("account");
    expect(activeRailIdForPath("/settings")).toBe("settings");
    expect(activeRailIdForPath("/instance")).toBe("settings");
    expect(activeRailIdForPath("/health")).toBe("settings");
  });
});
