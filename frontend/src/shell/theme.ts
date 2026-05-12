export const THEME_STORAGE_KEY = "comtrya.theme";

export const KNOWN_THEMES = [
  "print",
  "catppuccin",
  "ayu",
  "rose-pine",
  "tokyo-night",
  "gruvbox",
] as const;

export type ThemeName = (typeof KNOWN_THEMES)[number];

function isKnownTheme(candidate: string | null): candidate is ThemeName {
  return candidate !== null && (KNOWN_THEMES as readonly string[]).includes(candidate);
}

export function applyStoredTheme(): void {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  const theme: ThemeName = isKnownTheme(stored) ? stored : "print";
  document.documentElement.dataset.theme = theme;
}

export function persistTheme(theme: ThemeName): void {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  document.documentElement.dataset.theme = theme;
}
