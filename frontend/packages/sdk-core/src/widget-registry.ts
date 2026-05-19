/**
 * Widget registry — the hybrid slot model.
 *
 * Extensions publish widgets with an optional `defaultSlot` and
 * `defaultPriority`. The shell renders defaults out of the box; a
 * persisted user layout (per-user, per-repo) can override slot
 * placement or hide a widget entirely.
 *
 * Resolution:
 *   - If a user-layout entry sets `slot`, the widget appears in that
 *     slot at `entry.priority ?? widget.defaultPriority ?? 1000`.
 *   - Otherwise the widget appears in `defaultSlot` (when set) at
 *     `defaultPriority ?? 1000`.
 *   - If a user-layout entry sets `hidden: true`, the widget is not
 *     rendered anywhere.
 */

export interface WidgetContribution {
  /** Stable id used by user-layout overrides and unregistration. */
  id: string;
  /** Owning extension. */
  extensionId: string;
  /** Custom element name to mount (e.g. `comtrya-issues-list`). */
  element: string;
  /** Slot the widget mounts into by default. */
  defaultSlot?: string;
  /** Default render priority (lower renders first). */
  defaultPriority?: number;
  /** Permission required for the widget to be rendered. */
  requiredPermission?: string;
}

export interface UserLayoutEntry {
  /** Override slot placement. */
  slot?: string;
  /** Override priority (lower renders first). */
  priority?: number;
  /** When true, the widget is not rendered in any slot. */
  hidden?: boolean;
}

export type UserLayout = Record<string, UserLayoutEntry>;

export interface ResolvedWidget extends WidgetContribution {
  /** Effective slot after override resolution. */
  slot: string;
  /** Effective priority after override resolution. */
  priority: number;
}

const WIDGETS = new Map<string, WidgetContribution>();
let LAYOUT: UserLayout = {};
const SUBSCRIBERS = new Set<(slot: string | null) => void>();

export function registerWidget(contribution: WidgetContribution): void {
  WIDGETS.set(contribution.id, contribution);
  notify(effectiveSlot(contribution));
}

export function unregisterWidget(id: string): void {
  const previous = WIDGETS.get(id);
  if (!previous) return;
  WIDGETS.delete(id);
  notify(effectiveSlot(previous));
}

export function setUserLayout(layout: UserLayout): void {
  LAYOUT = layout ?? {};
  notify(null);
}

export function getUserLayout(): UserLayout {
  return { ...LAYOUT };
}

export function widgetsForSlot(slot: string): ResolvedWidget[] {
  const resolved: ResolvedWidget[] = [];
  for (const widget of WIDGETS.values()) {
    const entry = LAYOUT[widget.id];
    if (entry?.hidden) continue;
    const effective = entry?.slot ?? widget.defaultSlot;
    if (effective !== slot) continue;
    const priority = entry?.priority ?? widget.defaultPriority ?? 1000;
    resolved.push({ ...widget, slot: effective, priority });
  }
  resolved.sort((a, b) => a.priority - b.priority);
  return resolved;
}

export function allWidgets(): WidgetContribution[] {
  return Array.from(WIDGETS.values());
}

export function subscribeWidgets(
  callback: (slot: string | null) => void,
): () => void {
  SUBSCRIBERS.add(callback);
  return () => SUBSCRIBERS.delete(callback);
}

/** Test-only — clears all registrations and layout. */
export function _resetWidgetsForTesting(): void {
  WIDGETS.clear();
  LAYOUT = {};
  SUBSCRIBERS.clear();
}

function effectiveSlot(widget: WidgetContribution): string | null {
  const entry = LAYOUT[widget.id];
  if (entry?.hidden) return null;
  return entry?.slot ?? widget.defaultSlot ?? null;
}

function notify(slot: string | null): void {
  for (const subscriber of SUBSCRIBERS) subscriber(slot);
}
