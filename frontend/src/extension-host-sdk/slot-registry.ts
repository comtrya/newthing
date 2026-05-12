import type { Disposable, ResolvedSlot, SlotName } from "./types";

interface Entry extends ResolvedSlot { insertionOrder: number; }

export class SlotRegistry {
  private entries = new Map<SlotName, Entry[]>();
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

  winner(name: SlotName): ResolvedSlot | undefined {
    return this.entries.get(name)?.[0];
  }

  shadowed(name: SlotName): ResolvedSlot[] {
    const list = this.entries.get(name);
    if (!list || list.length <= 1) return [];
    return list.slice(1);
  }

  listSlots(): SlotName[] {
    return Array.from(this.entries.keys());
  }
}
