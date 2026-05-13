/**
 * @comtrya/sdk-core — framework-agnostic SDK for Comtrya extensions.
 *
 * Three concerns live here:
 *   1. `invokeOp` and `OpResult` — the HTTP transport that Phase 3
 *      codegen targets when emitting TypeScript clients.
 *   2. Slot + card registries — the framework-agnostic mounting story
 *      for cross-extension UI composition.
 *   3. Custom-element building blocks (e.g. `<comtrya-resource-card>`)
 *      that work in any framework via the W3C custom-elements API.
 *
 * The Vue and Preact adapter packages re-export and adapt this surface
 * for their respective component models.
 */

export type { OpResult } from "./runtime";
export { invokeOp, type InvokeOpOptions } from "./runtime";
export {
  registerSlot,
  subscribe as subscribeSlots,
  unregisterSlot,
  slotsFor,
  type SlotContribution,
  type SlotRegistry,
} from "./slot-registry";
export {
  registerCard,
  cardFor,
  type CardContribution,
} from "./card-registry";
export {
  defineResourceCardElement,
  type ResourceCardElement,
} from "./resource-card";
export {
  defineInlineEditElement,
  type InlineEditElement,
} from "./inline-edit";
export {
  defineSkeletonElement,
} from "./skeleton";
export {
  subscribeLiveEvents,
  type LiveEvent,
  type SubscribeOptions as LiveSubscribeOptions,
} from "./live-events";
export {
  registerCommand,
  listCommands,
  subscribeCommands,
  filterCommands,
  openPalette,
  bindGlobalShortcut,
  configurePaletteOpener,
  type CommandContribution,
} from "./command-palette";
export { applyOptimistic, type OptimisticOptions } from "./optimistic";
