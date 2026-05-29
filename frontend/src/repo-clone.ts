// Pure builders for the repository clone command shown in the repo
// header. Extracted from RepoHome.vue so the logic is unit-testable —
// the shell's .vue files aren't loadable in the bun-test setup (see
// route-paths.test.ts). The clone URL shares the same `/r/<repo>` base
// the SPA browses: the kernel reports `gitHttpPath` in that unified
// form (#127 / #136), so copy-paste clone and the address bar agree.

/**
 * Clone-tool prefix derived from the repo's declared `vcs`. A
 * `vcs: "jj"` repo on Comtrya is still served over git Smart HTTP, but
 * `jj git clone <url>` initialises a jj-on-git colocated working copy —
 * the user-visible payoff of declaring jj in the repo's CUE. Anything
 * else (git, or unset) uses the conventional `git clone`.
 */
export function cloneTool(vcs?: string | null): string {
  return vcs === "jj" ? "jj git clone" : "git clone";
}

/**
 * Absolute clone URL: `origin` + the kernel's `gitHttpPath`. Returns
 * `""` when the repo has no `gitHttpPath`. When `origin` is null/absent
 * (no browser, e.g. SSR) the path is returned unprefixed.
 */
export function cloneUrl(
  gitHttpPath?: string | null,
  origin?: string | null,
): string {
  if (!gitHttpPath) return "";
  if (origin == null) return gitHttpPath;
  return `${origin}${gitHttpPath}`;
}

/**
 * Full clone command (`<tool> <url>`), or `""` when there is no clone
 * URL to show.
 */
export function cloneCommand(
  gitHttpPath?: string | null,
  origin?: string | null,
  vcs?: string | null,
): string {
  const url = cloneUrl(gitHttpPath, origin);
  return url ? `${cloneTool(vcs)} ${url}` : "";
}
