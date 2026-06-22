/**
 * Project commands — keep the palette in sync with the current
 * repo's `package comtrya` CUE projects.
 *
 * When the user is on a repo page (`/r/<segments>` or
 * `/r/<segments>/p/<project>`), we fetch the repo's
 * `comtryaConfig.projects` and register one
 * `Switch to project <name>` command per Project plus three
 * Project-scoped queue verbs (iter 58). These commands are
 * dynamic — they unregister when the route leaves the repo and
 * re-register (possibly with a different set) when the user
 * navigates to a new repo.
 *
 * This is the Projects spine, surfaced through the keyboard:
 * Cmd-K, type "kernel", Enter → navigates to
 * `/r/<repo>/p/kernel`. No mouse needed.
 *
 * Iter 63 routes the CUE fetch through
 * `@comtrya/sdk-vue::fetchComtryaProjects` so this module
 * shares the canonical reader with `ext_epics/project-policy.ts`
 * and (eventually) every other Project-spine consumer.
 */
import type { Router } from "vue-router";
import { registerCommand } from "@comtrya/sdk-core";
import { fetchComtryaProjects } from "@comtrya/sdk-vue";
import { projectHref } from "./route-paths";
import { repoSegmentsFromRouteParams } from "./repo-workbench-routes";

export function bindProjectCommands(router: Router): void {
  let activeUnregisters: Array<() => void> = [];
  let lastRepoKey: string | null = null;
  let inFlight: AbortController | null = null;

  const clear = () => {
    for (const off of activeUnregisters) off();
    activeUnregisters = [];
  };

  router.afterEach(async (to) => {
    const segments = repoSegmentsFromRouteParams(to.params);
    const repoKey = segments.length > 0 ? segments.join("/") : null;

    if (repoKey === lastRepoKey) return;
    lastRepoKey = repoKey;

    inFlight?.abort();
    clear();

    if (!repoKey) return;

    const controller = new AbortController();
    inFlight = controller;

    try {
      const projects = await fetchComtryaProjects(segments);
      if (controller.signal.aborted) return;
      for (const project of projects) {
        if (!project.name) continue;
        const name = project.name;
        // 1. Navigate to the Project home.
        activeUnregisters.push(registerCommand({
          id: `core.switch-to-project.${repoKey}.${name}`,
          title: `Switch to project ${name}`,
          category: "Projects",
          extensionId: "core",
          run: () => {
            void router.push(projectHref(segments, name));
          },
        }));
        // 2. Issues queue scoped to this project. The URL filter
        //    shape mirrors iter 46's IssuesList `?project=<name>`;
        //    state defaults to OPEN so "open issues in <name>" is
        //    what the queue actually renders.
        activeUnregisters.push(registerCommand({
          id: `core.project-issues.${repoKey}.${name}`,
          title: `Open issues in ${name}`,
          category: "Projects",
          extensionId: "core",
          run: () => {
            void router.push(
              `/x/issues/?project=${encodeURIComponent(name)}`,
            );
          },
        }));
        // 3. Epics queue scoped to this project (all states).
        //    Iter 46 of EpicsList added URL `?project=<name>`; the
        //    chip-row default is ALL so this lands on every epic
        //    in the project.
        activeUnregisters.push(registerCommand({
          id: `core.project-epics.${repoKey}.${name}`,
          title: `Epics in ${name}`,
          category: "Projects",
          extensionId: "core",
          run: () => {
            void router.push(
              `/x/epics/?project=${encodeURIComponent(name)}`,
            );
          },
        }));
        // 4. In-progress slice of the project's epics — the most
        //    common "what is the team actively doing" query, one
        //    keystroke away.
        activeUnregisters.push(registerCommand({
          id: `core.project-epics-in-progress.${repoKey}.${name}`,
          title: `In-progress epics in ${name}`,
          category: "Projects",
          extensionId: "core",
          run: () => {
            void router.push(
              `/x/epics/?project=${encodeURIComponent(name)}&state=IN_PROGRESS`,
            );
          },
        }));
      }
    } catch (caught) {
      if ((caught as Error).name === "AbortError") return;
      console.warn("[project-commands] failed to load CUE projects:", caught);
    }
  });
}
