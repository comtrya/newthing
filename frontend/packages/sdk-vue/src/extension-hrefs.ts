import { buildExtensionUrl } from "@comtrya/sdk-core";

export interface ExtensionHrefOptions {
  repositorySegments?: readonly string[] | null;
}

export function extensionHref(
  routePrefix: string,
  subPath = "/",
  options: ExtensionHrefOptions = {},
): string {
  const workspaceHref = buildExtensionUrl(routePrefix, subPath);
  const repoSegments = normalizedRepoSegments(options.repositorySegments);
  if (!repoSegments) return workspaceHref;

  const normalizedSubPath = workspaceHref.slice(`/x/${routePrefix}`.length);
  const repoBase = `/r/${repoSegments.map(encodeURIComponent).join("/")}`;
  return `${repoBase}/${encodeURIComponent(routePrefix)}${normalizedSubPath}`;
}

function normalizedRepoSegments(
  segments: readonly string[] | null | undefined,
): string[] | null {
  const normalized = segments
    ?.map((segment) => segment.trim())
    .filter(Boolean) ?? [];
  return normalized.length > 0 ? normalized : null;
}
