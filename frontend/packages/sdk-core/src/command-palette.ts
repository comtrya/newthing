import { tinykeys } from "tinykeys";

/**
 * Command palette — framework-agnostic, keyboard-driven.
 *
 * Extensions contribute commands; the shell exposes a single Cmd-K
 * surface that filters and dispatches them.
 *
 * The palette is intentionally minimal — the shell wraps the registry
 * with whatever framework-specific UI it chooses. This file owns the
 * registry, the keyboard shortcut wiring, and the fuzzy filter; UI
 * shells call `openPalette()` to display.
 */

export interface CommandContribution {
  id: string;
  title: string;
  /** Optional category for grouping (e.g. "Issues", "Navigation"). */
  category?: string;
  /** Optional keyboard hint shown in the palette. */
  shortcut?: string;
  /** Owning extension id (for telemetry + filtering). */
  extensionId: string;
  /** Run handler — receives no args; commands gather their own input. */
  run: () => void | Promise<void>;
}

const COMMANDS = new Map<string, CommandContribution>();
const SUBSCRIBERS = new Set<() => void>();
let openListener: (() => void) | null = null;

export function registerCommand(c: CommandContribution): () => void {
  COMMANDS.set(c.id, c);
  for (const s of SUBSCRIBERS) s();
  return () => {
    COMMANDS.delete(c.id);
    for (const s of SUBSCRIBERS) s();
  };
}

export function listCommands(): CommandContribution[] {
  return Array.from(COMMANDS.values());
}

/** Subscribe to registry changes (palette UI re-renders on change). */
export function subscribeCommands(cb: () => void): () => void {
  SUBSCRIBERS.add(cb);
  return () => SUBSCRIBERS.delete(cb);
}

/** Case-insensitive subsequence match — simple, predictable. */
export function filterCommands(
  query: string,
  commands: CommandContribution[] = listCommands(),
): CommandContribution[] {
  if (!query) return commands;
  const q = query.toLowerCase();
  return commands.filter((c) => {
    const hay = (c.title + " " + (c.category ?? "")).toLowerCase();
    let i = 0;
    for (const ch of q) {
      const found = hay.indexOf(ch, i);
      if (found === -1) return false;
      i = found + 1;
    }
    return true;
  });
}

/** Register the shell's palette-opener. */
export function configurePaletteOpener(open: () => void): void {
  openListener = open;
}

/** Trigger the palette to open. The shell decides what "open" means. */
export function openPalette(): void {
  openListener?.();
}

/**
 * Bind Cmd/Ctrl-K globally. Returns an unbind function.
 *
 * Implemented on top of `tinykeys` so chord support, modifier-key
 * cross-platform handling (`$mod` = Cmd on Mac / Ctrl elsewhere),
 * and edit-field skipping live in the library, not in our code.
 */
export function bindGlobalShortcut(): () => void {
  if (typeof window === "undefined") return () => {};
  const unbind = tinykeys(window, {
    "$mod+KeyK": (event: KeyboardEvent) => {
      event.preventDefault();
      openPalette();
    },
  });
  return unbind;
}

/** Test-only. */
export function _resetCommandsForTesting(): void {
  COMMANDS.clear();
  SUBSCRIBERS.clear();
  openListener = null;
}
