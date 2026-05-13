import type { Disposable, ResolvedCard } from "./types";

/**
 * Card-renderer registry, keyed by `resourceKind`. Two-tier:
 *  - core defaults (registered by the shell);
 *  - extension contributions (registered by extensions via the host
 *    facade), which fully override the core default.
 *
 * Unlike `SlotRegistry`, only ONE winner exists per kind — there's no
 * priority stack. Second-and-later extension registrations for the same
 * kind are rejected (logged on console for diagnostics).
 */
export class CardRegistry {
  private extensions = new Map<string, ResolvedCard>();
  private coreDefaults = new Map<string, ResolvedCard>();

  add(entry: ResolvedCard): Disposable {
    const existing = this.extensions.get(entry.resourceKind);
    if (existing && existing.extensionId !== entry.extensionId) {
      console.warn(
        `card kind "${entry.resourceKind}" already claimed by ${existing.extensionId}; ` +
          `ignoring registration from ${entry.extensionId}`,
      );
      return { dispose: () => {} };
    }
    this.extensions.set(entry.resourceKind, entry);
    let disposed = false;
    return {
      dispose: () => {
        if (disposed) return;
        disposed = true;
        if (this.extensions.get(entry.resourceKind)?.extensionId === entry.extensionId) {
          this.extensions.delete(entry.resourceKind);
        }
      },
    };
  }

  registerCoreDefault(entry: ResolvedCard): Disposable {
    this.coreDefaults.set(entry.resourceKind, entry);
    let disposed = false;
    return {
      dispose: () => {
        if (disposed) return;
        disposed = true;
        if (this.coreDefaults.get(entry.resourceKind) === entry) {
          this.coreDefaults.delete(entry.resourceKind);
        }
      },
    };
  }

  winner(resourceKind: string): ResolvedCard | undefined {
    return this.extensions.get(resourceKind) ?? this.coreDefaults.get(resourceKind);
  }

  listKinds(): string[] {
    const all = new Set<string>([
      ...this.extensions.keys(),
      ...this.coreDefaults.keys(),
    ]);
    return Array.from(all);
  }
}
