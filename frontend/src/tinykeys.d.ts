/**
 * Type shim for tinykeys@3.
 *
 * The library ships `dist/tinykeys.d.ts` but doesn't add a `types`
 * conditional to its package.json `exports` map, so TS bundler
 * resolution can't reach the types through the export gate. This
 * shim re-declares the surface we use.
 */
declare module "tinykeys" {
  export type KeyBindingHandler = (event: KeyboardEvent) => void;
  export type KeyBindingMap = Record<string, KeyBindingHandler>;

  export interface KeyBindingOptions {
    /** Time window (ms) within which sequence keys must be pressed. */
    timeout?: number;
    /** Event name to listen on (defaults to "keydown"). */
    event?: "keydown" | "keyup";
    /** Capture phase (defaults to false). */
    capture?: boolean;
  }

  export function tinykeys(
    target: Window | HTMLElement,
    bindings: KeyBindingMap,
    options?: KeyBindingOptions,
  ): () => void;
}
