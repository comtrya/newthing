<script setup lang="ts">
/**
 * Sticky orientation crumbs.
 *
 * Reads the current route and decomposes it into a series of
 * `workspace › repo › project › section › item` crumbs. Every
 * crumb except the last is a `<RouterLink>`; the last is bold,
 * unlinked, and represents where the user is right now.
 *
 * Lives under the topbar in the shell layout (App.vue) and is
 * `position: sticky` so it stays in view on scroll without ever
 * stealing pixels from the page content's start.
 *
 * Why no kernel call: the shell already knows the route shape. We
 * derive crumbs from path segments — `/r/:groups+/:repo[/p/:project]`
 * for repos and Projects, `/x/:prefix/...` for extension routes,
 * `/new` / `/instance` / `/settings` for shell routes. The repo
 * route's `:groups+` is rolled up as a single "owner/path" crumb
 * so deep nested groups don't blow out the strip.
 */
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

interface Crumb {
  label: string;
  to?: string;
}

const EXTENSION_LABELS: Record<string, string> = {
  issues: "Issues",
  pulls: "Pull requests",
  epics: "Epics",
  docs: "Docs",
  checks: "Checks",
};

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

const crumbs = computed<Crumb[]>(() => {
  const path = route.path;
  const items: Crumb[] = [{ label: "Workspace", to: "/" }];

  if (path === "/" || path === "") return items;

  // /r/<groups...>/<repo>[/p/<project>]
  if (path.startsWith("/r/")) {
    const rest = path.slice("/r/".length);
    const projectIdx = rest.indexOf("/p/");
    const repoPath = projectIdx >= 0 ? rest.slice(0, projectIdx) : rest;
    const projectName = projectIdx >= 0
      ? rest.slice(projectIdx + "/p/".length).split("/")[0]
      : null;
    const repoSegments = repoPath.split("/").filter(Boolean).map(decodeSegment);
    if (repoSegments.length > 0) {
      items.push({
        label: repoSegments.join("/"),
        to: projectName ? `/r/${repoPath}` : undefined,
      });
    }
    if (projectName) {
      items.push({ label: decodeSegment(projectName) });
    }
    return items;
  }

  // /x/<prefix>/<rest>
  if (path.startsWith("/x/")) {
    const rest = path.slice("/x/".length);
    const segments = rest.split("/").filter(Boolean).map(decodeSegment);
    const [prefix, ...tail] = segments;
    if (prefix) {
      const label = EXTENSION_LABELS[prefix] ?? prefix;
      items.push({ label, to: tail.length > 0 ? `/x/${prefix}/` : undefined });
    }
    for (let i = 0; i < tail.length; i += 1) {
      const isLast = i === tail.length - 1;
      const upto = tail.slice(0, i + 1).map(encodeURIComponent).join("/");
      items.push({
        label: tail[i] ?? "",
        to: isLast ? undefined : `/x/${prefix}/${upto}`,
      });
    }
    return items;
  }

  // Single-segment shell routes
  const shellLabels: Record<string, string> = {
    new: "New repository",
    instance: "Instance",
    settings: "Settings",
    health: "Health",
  };
  const segment = path.replace(/^\//, "").split("/")[0] ?? "";
  if (segment && shellLabels[segment]) {
    items.push({ label: shellLabels[segment] });
  } else if (segment) {
    items.push({ label: segment });
  }
  return items;
});
</script>

<template>
  <nav class="breadcrumb" aria-label="Breadcrumb" data-smoke="breadcrumb">
    <ol>
      <li
        v-for="(crumb, idx) in crumbs"
        :key="`${idx}-${crumb.label}`"
        :class="{ current: !crumb.to }"
      >
        <RouterLink v-if="crumb.to" :to="crumb.to">{{ crumb.label }}</RouterLink>
        <span v-else>{{ crumb.label }}</span>
        <span v-if="idx < crumbs.length - 1" class="separator" aria-hidden="true">›</span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.breadcrumb {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--paper, #fffdf8);
  border-bottom: 1px solid var(--rule-light, #d8d1c4);
  padding: 8px 0;
  margin: -16px 0 16px;
}

.breadcrumb ol {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0 6px;
  align-items: baseline;
  font-family: var(--mono, monospace);
  font-size: 11.5px;
  letter-spacing: 0.02em;
}

.breadcrumb li {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  color: var(--ink-faint, #68645c);
}

.breadcrumb a {
  color: var(--ink-soft, #2c2b28);
  text-decoration: none;
}

.breadcrumb a:hover {
  color: var(--ink, #111);
  border-bottom: 1px solid currentColor;
}

.breadcrumb li.current span {
  color: var(--ink, #111);
  font-weight: 600;
}

.breadcrumb .separator {
  color: var(--ink-fainter, #918b80);
}
</style>
