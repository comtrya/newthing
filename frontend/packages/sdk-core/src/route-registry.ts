export interface RouteContribution {
  id: string;
  extensionId: string;
  routePrefix: string;
  path: string;
  element: string;
  init?: unknown;
}

export interface RouteMatch {
  route: RouteContribution;
  params: Record<string, string>;
}

const ROUTES = new Map<string, RouteContribution>();
const SUBSCRIBERS = new Set<(prefix: string) => void>();

export function registerRoute(contribution: RouteContribution): void {
  if (!contribution.path.startsWith("/")) {
    throw new Error(`route path must start with "/", got "${contribution.path}"`);
  }
  if (!contribution.routePrefix || contribution.routePrefix.length === 0) {
    throw new Error(
      `route registration for extension "${contribution.extensionId}" must include a non-empty routePrefix; extensions own /x/<routePrefix>/ only`,
    );
  }
  if (contribution.routePrefix.includes("/")) {
    throw new Error(
      `routePrefix "${contribution.routePrefix}" for extension "${contribution.extensionId}" must be a single path segment under /x/`,
    );
  }
  ROUTES.set(contribution.id, contribution);
  notify(contribution.routePrefix);
}

/**
 * Build a URL for a registered extension route. Refuses to construct
 * any path outside `/x/<routePrefix>/...` — extensions own that
 * namespace and nothing else.
 */
export function buildExtensionUrl(
  routePrefix: string,
  subPath: string = "/",
): string {
  if (!routePrefix || routePrefix.length === 0) {
    throw new Error("buildExtensionUrl requires a non-empty routePrefix");
  }
  if (routePrefix.includes("/")) {
    throw new Error(
      `routePrefix "${routePrefix}" must be a single path segment under /x/`,
    );
  }
  const normalized = subPath.startsWith("/") ? subPath : `/${subPath}`;
  // Strip a trailing run of `/` without a backtracking regex. The
  // previous `/\/+$/` was flagged as polynomial ReDoS on long inputs
  // of unbroken slashes; a hand loop is O(n) worst-case and clearer
  // about the intent ("trim trailing slashes, but never collapse the
  // single-slash root").
  let end = normalized.length;
  while (end > 1 && normalized.charCodeAt(end - 1) === 0x2f /* '/' */) {
    end -= 1;
  }
  const trimmed = normalized === "/" ? "" : normalized.slice(0, end);
  return `/x/${routePrefix}${trimmed}`;
}

export function unregisterRoute(id: string): void {
  const route = ROUTES.get(id);
  if (!route) return;
  ROUTES.delete(id);
  notify(route.routePrefix);
}

export function routesForPrefix(prefix: string): RouteContribution[] {
  return Array.from(ROUTES.values()).filter((route) => route.routePrefix === prefix);
}

export function routeFor(prefix: string, subPath: string): RouteMatch | undefined {
  for (const route of routesForPrefix(prefix)) {
    const match = pathMatches(route.path, subPath);
    if (match.matched) return { route, params: match.params };
  }
  return undefined;
}

export function subscribeRoutes(callback: (prefix: string) => void): () => void {
  SUBSCRIBERS.add(callback);
  return () => SUBSCRIBERS.delete(callback);
}

export function _resetRoutesForTesting(): void {
  ROUTES.clear();
  SUBSCRIBERS.clear();
}

function notify(prefix: string): void {
  for (const subscriber of SUBSCRIBERS) subscriber(prefix);
}

function pathMatches(
  pattern: string,
  actual: string,
): { matched: boolean; params: Record<string, string> } {
  if (pattern === "/" && (actual === "/" || actual === "")) {
    return { matched: true, params: {} };
  }

  const patternSegments = pattern.split("/").filter(Boolean);
  const actualSegments = actual.split("/").filter(Boolean);
  if (patternSegments.length !== actualSegments.length) {
    return { matched: false, params: {} };
  }

  const params: Record<string, string> = {};
  for (let index = 0; index < patternSegments.length; index += 1) {
    const patternSegment = patternSegments[index]!;
    const actualSegment = actualSegments[index]!;
    if (patternSegment.startsWith(":")) {
      params[patternSegment.slice(1)] = actualSegment;
    } else if (patternSegment !== actualSegment) {
      return { matched: false, params: {} };
    }
  }
  return { matched: true, params };
}
