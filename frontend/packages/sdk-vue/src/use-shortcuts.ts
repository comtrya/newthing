/**
 * `useShortcuts` — Vue composable wrapping `tinykeys` for component-
 * scoped keyboard bindings.
 *
 * The library handles cross-platform `$mod` (Cmd / Ctrl) and key
 * sequences (`g h`). The composable adds:
 *
 * - **Automatic unbind on component unmount.** No leaking listeners
 *   across navigations.
 * - **`enabled` ref.** A component can gate its shortcuts (e.g. the
 *   palette only listens while `open === true`).
 * - **`target` option.** Scope to a specific element instead of
 *   `window`.
 * - **Input-skip guard.** tinykeys v3 does NOT ship this — bindings
 *   fire on every keydown regardless of focus target. We wrap each
 *   handler so bare-letter shortcuts (j, k, o, x, /, c, …) skip when
 *   the user is typing in an `<input>`, `<textarea>`, or
 *   `[contenteditable]`. **Exceptions that still fire inside inputs:**
 *   any binding with a modifier key (`$mod+K`, `Cmd+Enter`) and
 *   `Escape` (universal blur-or-cancel). For inputs that need
 *   Esc-to-clear-value, keep a Vue `@keydown.esc` on the element
 *   itself; it runs before this composable sees the event.
 *
 * Single import point for all in-component keyboard handling — the
 * previous pattern of raw `window.addEventListener("keydown", …)`
 * with bespoke skip/escape rules is intentionally retired.
 */

import { onUnmounted, watch, type Ref } from "vue";
import { tinykeys, type KeyBindingMap } from "tinykeys";

export interface UseShortcutsOptions {
  /** Bind on a specific element (defaults to `window`). */
  target?: Window | HTMLElement | null;
  /** Reactive enable/disable gate. Defaults to always enabled. */
  enabled?: Ref<boolean>;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target instanceof HTMLInputElement) {
    // Most input types accept text. Buttons / checkboxes / radios / range
    // don't need shortcut-suppression because they're not text-bearing.
    const t = target.type;
    return (
      t === "" ||
      t === "text" ||
      t === "search" ||
      t === "email" ||
      t === "url" ||
      t === "password" ||
      t === "tel" ||
      t === "number" ||
      t === "date" ||
      t === "datetime-local" ||
      t === "month" ||
      t === "week" ||
      t === "time"
    );
  }
  if (target instanceof HTMLTextAreaElement) return true;
  if (target.isContentEditable) return true;
  return false;
}

/**
 * Bindings with a modifier key (`$mod`, `Cmd`, `Ctrl`, `Alt`, `Shift`,
 * `Meta`, `Control`) and bindings keyed on `Escape` always fire,
 * even inside inputs. Everything else (bare letters, `/`, `?`, sequences
 * like `g h`) is suppressed while the user is typing.
 */
function bindingAlwaysFiresInInputs(binding: string): boolean {
  if (/Escape/i.test(binding)) return true;
  return /\$mod|Cmd|Ctrl|Alt|Shift|Meta|Control/i.test(binding);
}

function wrapWithInputGuard(bindings: KeyBindingMap): KeyBindingMap {
  const out: KeyBindingMap = {};
  for (const [key, handler] of Object.entries(bindings)) {
    if (bindingAlwaysFiresInInputs(key)) {
      out[key] = handler;
      continue;
    }
    out[key] = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;
      handler(event);
    };
  }
  return out;
}

export function useShortcuts(
  bindings: KeyBindingMap,
  options: UseShortcutsOptions = {},
): void {
  if (typeof window === "undefined") return;
  let unbind: (() => void) | null = null;
  const guarded = wrapWithInputGuard(bindings);

  const bind = (): void => {
    if (unbind) return;
    const target = options.target ?? window;
    unbind = tinykeys(target as Window, guarded);
  };

  const release = (): void => {
    unbind?.();
    unbind = null;
  };

  if (options.enabled) {
    watch(
      options.enabled,
      (on) => {
        if (on) bind();
        else release();
      },
      { immediate: true },
    );
  } else {
    bind();
  }

  onUnmounted(release);
}
