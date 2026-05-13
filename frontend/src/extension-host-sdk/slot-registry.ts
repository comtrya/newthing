import type { Disposable, ResolvedSlot, SlotName } from "./types";

interface Entry extends ResolvedSlot { insertionOrder: number; }

/**
 * Slot registry with two tiers:
 *  - core defaults (registered by the shell), consulted only when no
 *    extension has claimed the slot;
 *  - extension contributions, which fully override the core default.
 *
 * This means installing an extension that claims a slot always wins over the
 * shell's built-in renderer for that slot. See docs/extensions.md.
 */
export class SlotRegistry {
  private entries = new Map<SlotName, Entry[]>();
  private coreDefaults = new Map<SlotName, Entry>();
  private nextOrder = 0;

  add(slot: ResolvedSlot, name: SlotName): Disposable {
    const entry: Entry = { ...slot, insertionOrder: this.nextOrder++ };
    const list = this.entries.get(name) ?? [];
    list.push(entry);
    list.sort((a, b) => (a.priority - b.priority) || (a.insertionOrder - b.insertionOrder));
    this.entries.set(name, list);
    let disposed = false;
    return {
      dispose: () => {
        if (disposed) return;
        disposed = true;
        const current = this.entries.get(name);
        if (!current) return;
        const filtered = current.filter((e) => e !== entry);
        if (filtered.length === 0) this.entries.delete(name);
        else this.entries.set(name, filtered);
      },
    };
  }

  /**
   * Register a core (shell-provided) default for a slot. Always shadowed
   * by any extension claim on the same slot.
   */
  registerCoreDefault(slot: ResolvedSlot, name: SlotName): Disposable {
    const entry: Entry = { ...slot, insertionOrder: this.nextOrder++ };
    this.coreDefaults.set(name, entry);
    let disposed = false;
    return {
      dispose: () => {
        if (disposed) return;
        disposed = true;
        if (this.coreDefaults.get(name) === entry) this.coreDefaults.delete(name);
      },
    };
  }

  private toResolved(e: Entry): ResolvedSlot {
    const { insertionOrder: _drop, ...resolved } = e;
    return resolved;
  }

  winner(name: SlotName): ResolvedSlot | undefined {
    const e = this.entries.get(name)?.[0] ?? this.coreDefaults.get(name);
    return e ? this.toResolved(e) : undefined;
  }

  shadowed(name: SlotName): ResolvedSlot[] {
    const extensionEntries = this.entries.get(name) ?? [];
    const core = this.coreDefaults.get(name);
    if (extensionEntries.length === 0) return [];
    // Any extension claim shadows the core default; later extensions are
    // shadowed by the earlier-priority winner.
    const tail = extensionEntries.slice(1).map((e) => this.toResolved(e));
    return core ? [...tail, this.toResolved(core)] : tail;
  }

  listSlots(): SlotName[] {
    const all = new Set<SlotName>([
      ...this.entries.keys(),
      ...this.coreDefaults.keys(),
    ]);
    return Array.from(all);
  }
}
