/**
 * Project commands — keep the palette in sync with the current
 * repo's `package comtrya` CUE projects.
 *
 * When the user is on a repo page (`/r/<segments>` or
 * `/r/<segments>/p/<project>`), we fetch the repo's
 * `comtryaConfig.projects` and register one
 * `Switch to project <name>` command per Project. These commands
 * are dynamic — they unregister when the route leaves the repo
 * and re-register (possibly with a different set) when the user
 * navigates to a new repo.
 *
 * This is the Projects spine, surfaced through the keyboard:
 * Cmd-K, type "kernel", Enter → navigates to
 * `/r/<repo>/p/kernel`. No mouse needed.
 */
import type { Router } from "vue-router";
import { registerCommand } from "@comtrya/sdk-core";
import { projectHref } from "./route-paths";

interface CueProject {
  name?: string;
  root?: string;
  labels?: string[];
}

interface ComtryaConfigPayload {
  workspace?: {
    repositoryByPath?: {
      comtryaConfig?: { projects?: CueProject[] | null } | null;
    } | null;
  };
}

const COMTRYA_CONFIG_QUERY = `query ProjectCommandsConfig($segments: [String!]!) {
  workspace {
    repositoryByPath(segments: $segments) {
      comtryaConfig
    }
  }
}`;

export function bindProjectCommands(router: Router): void {
  let activeUnregisters: Array<() => void> = [];
  let lastRepoKey: string | null = null;
  let inFlight: AbortController | null = null;

  const clear = () => {
    for (const off of activeUnregisters) off();
    activeUnregisters = [];
  };

  router.afterEach(async (to) => {
    const segments = repoSegmentsFromRoute(to.path);
    const repoKey = segments.length > 0 ? segments.join("/") : null;

    if (repoKey === lastRepoKey) return;
    lastRepoKey = repoKey;

    inFlight?.abort();
    clear();

    if (!repoKey) return;

    const controller = new AbortController();
    inFlight = controller;

    try {
      const projects = await fetchProjects(segments, controller.signal);
      if (controller.signal.aborted) return;
      for (const project of projects) {
        if (!project.name) continue;
        const name = project.name;
        const unregister = registerCommand({
          id: `core.switch-to-project.${repoKey}.${name}`,
          title: `Switch to project ${name}`,
          category: "Projects",
          extensionId: "core",
          run: () => {
            void router.push(projectHref(segments, name));
          },
        });
        activeUnregisters.push(unregister);
      }
    } catch (caught) {
      if ((caught as Error).name === "AbortError") return;
      console.warn("[project-commands] failed to load CUE projects:", caught);
    }
  });
}

function repoSegmentsFromRoute(path: string): string[] {
  if (!path.startsWith("/r/")) return [];
  const rest = path.slice("/r/".length);
  const projectIdx = rest.indexOf("/p/");
  const repoPath = projectIdx >= 0 ? rest.slice(0, projectIdx) : rest;
  return repoPath.split("/").filter(Boolean).map(decodeURIComponent);
}

async function fetchProjects(
  segments: string[],
  signal: AbortSignal,
): Promise<CueProject[]> {
  const response = await fetch("/graphql", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: COMTRYA_CONFIG_QUERY,
      variables: { segments },
    }),
    signal,
  });
  const envelope = (await response.json()) as { data?: ComtryaConfigPayload };
  const projects = envelope.data?.workspace?.repositoryByPath?.comtryaConfig?.projects ?? [];
  return projects.filter((p): p is CueProject => p !== null && typeof p === "object");
}
