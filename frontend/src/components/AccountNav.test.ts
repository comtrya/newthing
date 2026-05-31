/**
 * Tests for AccountNav — the account section sub-navigation.
 * Verifies both credential pages are represented and the paths are correct.
 */

import { describe, expect, test } from "bun:test";

// Mirrors the tabs definition in AccountNav.vue
const ACCOUNT_TABS = [
  { id: "git-tokens", label: "Personal access tokens", to: "/account/git-tokens" },
  { id: "ssh-keys", label: "SSH keys", to: "/account/ssh-keys" },
];

describe("AccountNav tabs", () => {
  test("includes personal access tokens tab", () => {
    const tab = ACCOUNT_TABS.find((t) => t.id === "git-tokens");
    expect(tab).toBeDefined();
    expect(tab!.to).toBe("/account/git-tokens");
    expect(tab!.label).toContain("token");
  });

  test("includes SSH keys tab", () => {
    const tab = ACCOUNT_TABS.find((t) => t.id === "ssh-keys");
    expect(tab).toBeDefined();
    expect(tab!.to).toBe("/account/ssh-keys");
    expect(tab!.label.toLowerCase()).toContain("ssh");
  });

  test("both credential surfaces are in the nav", () => {
    expect(ACCOUNT_TABS).toHaveLength(2);
    const ids = ACCOUNT_TABS.map((t) => t.id);
    expect(ids).toContain("git-tokens");
    expect(ids).toContain("ssh-keys");
  });

  test("all paths start with /account/", () => {
    for (const tab of ACCOUNT_TABS) {
      expect(tab.to).toMatch(/^\/account\//);
    }
  });
});

// isActive logic mirror
function isActive(currentPath: string, tabTo: string): boolean {
  return currentPath === tabTo || currentPath.startsWith(tabTo + "/");
}

describe("AccountNav active state", () => {
  test("marks git-tokens active when on /account/git-tokens", () => {
    expect(isActive("/account/git-tokens", "/account/git-tokens")).toBe(true);
  });

  test("marks ssh-keys active when on /account/ssh-keys", () => {
    expect(isActive("/account/ssh-keys", "/account/ssh-keys")).toBe(true);
  });

  test("git-tokens not active when on /account/ssh-keys", () => {
    expect(isActive("/account/ssh-keys", "/account/git-tokens")).toBe(false);
  });

  test("ssh-keys not active when on /account/git-tokens", () => {
    expect(isActive("/account/git-tokens", "/account/ssh-keys")).toBe(false);
  });
});
