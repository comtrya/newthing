import { beforeEach, describe, expect, test } from "bun:test";
import { applyStoredTheme, persistTheme, THEME_STORAGE_KEY, KNOWN_THEMES } from "./theme";

describe("theme persistence", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
    localStorage.clear();
  });

  test("applyStoredTheme defaults to print when nothing stored", () => {
    applyStoredTheme();
    expect(document.documentElement.dataset.theme).toBe("print");
  });

  test("applyStoredTheme restores persisted theme", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "catppuccin");
    applyStoredTheme();
    expect(document.documentElement.dataset.theme).toBe("catppuccin");
  });

  test("applyStoredTheme falls back to print on unknown stored value", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "bogus");
    applyStoredTheme();
    expect(document.documentElement.dataset.theme).toBe("print");
  });

  test("persistTheme writes to localStorage and applies", () => {
    persistTheme("rose-pine");
    expect(document.documentElement.dataset.theme).toBe("rose-pine");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("rose-pine");
  });

  test("KNOWN_THEMES contains the six v1 themes", () => {
    expect(new Set(KNOWN_THEMES)).toEqual(new Set([
      "print", "catppuccin", "ayu", "rose-pine", "tokyo-night", "gruvbox",
    ]));
  });
});
