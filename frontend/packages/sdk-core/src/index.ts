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

export type { OpResult, OpError, OpErrorCode } from "./runtime";
export { invokeOp, type InvokeOpOptions } from "./runtime";
export {
  registerWidget,
  unregisterWidget,
  setUserLayout,
  getUserLayout,
  widgetsForSlot,
  allWidgets,
  subscribeWidgets,
  type WidgetContribution,
  type ResolvedWidget,
  type UserLayout,
  type UserLayoutEntry,
} from "./widget-registry";
export {
  configureGraphQLClient,
  getGraphQLClient,
  type GraphQLClient,
  type GraphQLClientOptions,
} from "./graphql-client";
export {
  getSessionToken,
  clearSessionToken,
  type SessionBootstrapOptions,
} from "./session";
export {
  registerCard,
  unregisterCard,
  cardFor,
  type CardContribution,
} from "./card-registry";
export {
  registerRelationshipType,
  relationshipTypesForSourceKind,
  registerRelationshipTargetProvider,
  unregisterRelationshipTargetProvider,
  relationshipTargetProviderForKind,
  subscribeRelationshipTypes,
  type RelationshipTarget,
  type RelationshipTargetContext,
  type RelationshipTargetProvider,
  type RelationshipTypeContribution,
} from "./relationship-registry";
export {
  registerRoute,
  unregisterRoute,
  routesForPrefix,
  routeFor,
  buildExtensionUrl,
  subscribeRoutes,
  type RouteContribution,
  type RouteMatch,
} from "./route-registry";
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
export {
  activeWorkspaceId,
  activeWorkspaceUri,
  setActiveWorkspaceId,
  subscribeWorkspaceId,
  whenWorkspaceReady,
} from "./workspace-store";
