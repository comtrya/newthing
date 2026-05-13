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
  ROUTES.set(contribution.id, contribution);
  notify(contribution.routePrefix);
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
