export const EXTENSION_ROUTE_QUERY_KEYS = [
  "workspaceId",
  "repositoryId",
  "projectName",
  "state",
] as const;

export type ExtensionRouteQueryKey = typeof EXTENSION_ROUTE_QUERY_KEYS[number];
export type ExtensionRouteQueryValue =
  | string
  | readonly (string | null)[]
  | null
  | undefined;
export type ExtensionRouteQueryInput = Record<string, ExtensionRouteQueryValue>;

export function extensionRouteQueryContext(
  query: ExtensionRouteQueryInput,
): Partial<Record<ExtensionRouteQueryKey, string>> {
  const context: Partial<Record<ExtensionRouteQueryKey, string>> = {};
  for (const key of EXTENSION_ROUTE_QUERY_KEYS) {
    const value = firstQueryString(query[key]);
    if (value !== undefined) {
      context[key] = value;
    }
  }
  return context;
}

export function extensionRouteElementContext(
  base: Record<string, unknown>,
  query: ExtensionRouteQueryInput,
): Record<string, unknown> {
  return {
    ...base,
    ...extensionRouteQueryContext(query),
  };
}

export function extensionRouteQueryContextKey(
  context: Partial<Record<ExtensionRouteQueryKey, string>>,
): string {
  return EXTENSION_ROUTE_QUERY_KEYS
    .map((key) => `${key}:${context[key] ?? ""}`)
    .join("|");
}

function firstQueryString(value: ExtensionRouteQueryValue): string | undefined {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return undefined;
  return value.find((entry): entry is string => typeof entry === "string");
}
