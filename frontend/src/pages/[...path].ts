import type { APIRoute } from "astro";
import { jsonError, proxyComtrya } from "../server/comtrya";

export const prerender = false;

const ALLOWED_PREFIXES = [
  "/api/v1/",
  "/auth/",
  "/events",
  "/git/",
  "/graphql",
  "/graphql/stream",
  "/healthz",
  "/readyz",
  "/_extensions/",
];

function routePath(path?: string): string {
  return `/${path ?? ""}`;
}

function canProxy(path: string): boolean {
  return ALLOWED_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix));
}

const handler: APIRoute = ({ params, request }) => {
  const path = routePath(params.path);
  if (!canProxy(path)) {
    return jsonError(404, "NOT_FOUND", "route is not served by the Comtrya frontend");
  }
  return proxyComtrya(request, path);
};

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
