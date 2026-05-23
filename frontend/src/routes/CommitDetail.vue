<script setup lang="ts">
/**
 * Per-commit detail view. Reached from the Commits tab on a repo.
 *
 * The kernel exposes a single-shot `commitDiff(oid)` field on
 * `repositoryByPath` which returns metadata + a unified patch. We
 * parse the patch client-side with the same parser the PR DiffView
 * uses so commit-vs-pull rendering stays consistent.
 */
import { computed, ref, watch } from "vue";
import { getGraphQLClient } from "@comtrya/sdk-core";
import RepoTabs from "../components/RepoTabs.vue";
import { parseUnifiedDiff, summarize, type DiffFile } from "../diff";

const props = defineProps<{
  groups: string[];
  repo: string;
  oid: string;
}>();

interface RepositoryIdentity {
  id?: string | null;
  path?: string | null;
  defaultBranch?: string | null;
  openPullRequests?: number | null;
}

interface CommitDiff {
  oid: string;
  shortOid: string;
  subject: string;
  author: string;
  authorEmail?: string | null;
  time: string;
  body?: string | null;
  parents?: string[] | null;
  changeId?: string | null;
  patch: string;
  error?: string | null;
}

interface QueryResponse {
  workspace?: {
    repositoryByPath?:
      | (RepositoryIdentity & { commitDiff?: CommitDiff | null })
      | null;
  } | null;
}

const COMMIT_QUERY = `query($segments: [String!]!, $oid: ID!) {
  workspace {
    repositoryByPath(segments: $segments) {
      id
      path
      defaultBranch
      openPullRequests
      commitDiff(oid: $oid) {
        oid
        shortOid
        subject
        author
        authorEmail
        time
        body
        parents
        changeId
        patch
        error
      }
    }
  }
}`;

const repository = ref<RepositoryIdentity | null>(null);
const commit = ref<CommitDiff | null>(null);
const loadState = ref<"loading" | "ready" | "missing" | "error">("loading");
const loadError = ref<string | null>(null);

const repoSegments = computed(() => [...props.groups, props.repo]);
const repoPath = computed(() => repoSegments.value.join("/"));
const repoHomePath = computed(() =>
  `/r/${repoSegments.value.map(encodeURIComponent).join("/")}`,
);
// `/commits` list view isn't registered yet — RepoHome surfaces the
// commit strip. Back-link points there; if/when a dedicated Commits
// route lands, switch this to `${repoHomePath}/commits`.
const commitsPath = computed(() => repoHomePath.value);

const files = computed<DiffFile[]>(() =>
  commit.value ? parseUnifiedDiff(commit.value.patch ?? "") : [],
);
const totals = computed(() => summarize(files.value));

const collapsed = ref<Record<string, boolean>>({});
function toggleFile(path: string): void {
  collapsed.value[path] = !collapsed.value[path];
}
function isCollapsed(path: string): boolean {
  return collapsed.value[path] === true;
}
function fileBadge(file: DiffFile): string {
  switch (file.status) {
    case "added": return "added";
    case "deleted": return "deleted";
    case "renamed": return "renamed";
    default: return "modified";
  }
}

watch(
  [repoSegments, () => props.oid],
  async ([segments, oid], _prev, onCleanup) => {
    if (!oid) {
      loadState.value = "missing";
      return;
    }
    let cancelled = false;
    onCleanup(() => { cancelled = true; });
    loadState.value = "loading";
    loadError.value = null;
    try {
      const data = await getGraphQLClient().query<QueryResponse>(COMMIT_QUERY, {
        segments,
        oid,
      });
      if (cancelled) return;
      const repo = data?.workspace?.repositoryByPath ?? null;
      if (!repo) {
        loadState.value = "missing";
        repository.value = null;
        commit.value = null;
        return;
      }
      repository.value = repo;
      const cd = repo.commitDiff ?? null;
      commit.value = cd;
      if (!cd) {
        loadState.value = "missing";
      } else if (cd.error) {
        loadState.value = "error";
        loadError.value = cd.error;
      } else {
        loadState.value = "ready";
      }
    } catch (error) {
      if (cancelled) return;
      loadState.value = "error";
      loadError.value = error instanceof Error ? error.message : String(error);
    }
  },
  { immediate: true },
);

const shortOid = computed(() => commit.value?.shortOid ?? props.oid.slice(0, 7));
</script>

<template>
  <header class="repo-header repo-header-compact">
    <div class="repo-header-row">
      <RouterLink :to="commitsPath" class="repo-header-back">← Repo</RouterLink>
      <span class="repo-header-path mono">{{ repoPath }}</span>
      <span class="spacer" />
      <code class="commit-detail-oid" :title="oid">{{ shortOid }}</code>
    </div>
    <RepoTabs
      :segments="repoSegments"
      :repository-id="repository?.id ?? null"
      :open-pulls="repository?.openPullRequests ?? 0"
    />
  </header>

  <section class="commit-detail" data-smoke="commit-detail">
    <section v-if="loadState === 'loading'" class="commit-detail-state">
      Loading commit
    </section>
    <section v-else-if="loadState === 'missing'" class="commit-detail-state">
      Commit not found on this repository.
    </section>
    <section v-else-if="loadState === 'error'" class="commit-detail-state error">
      {{ loadError ?? "Failed to load commit." }}
    </section>

    <template v-else-if="commit">
      <header class="commit-detail-head">
        <h1 class="serif commit-detail-subject">{{ commit.subject }}</h1>
        <div class="commit-detail-meta">
          <span class="commit-detail-author">{{ commit.author }}</span>
          <span v-if="commit.authorEmail" class="commit-detail-email mono">
            &lt;{{ commit.authorEmail }}&gt;
          </span>
          <span class="commit-detail-time">{{ commit.time }}</span>
          <code v-if="commit.changeId" class="commit-detail-change-id" :title="`jj change-id ${commit.changeId}`">
            {{ commit.changeId.slice(0, 8) }}
          </code>
        </div>
        <pre v-if="commit.body" class="commit-detail-body mono">{{ commit.body }}</pre>
        <div v-if="commit.parents && commit.parents.length > 0" class="commit-detail-parents">
          <span class="eyebrow">Parent{{ commit.parents.length === 1 ? '' : 's' }}</span>
          <RouterLink
            v-for="parent in commit.parents"
            :key="parent"
            :to="`${repoHomePath}/commits/${parent}`"
            class="commit-detail-parent mono"
            :title="parent"
          >{{ parent.slice(0, 7) }}</RouterLink>
        </div>
      </header>

      <section class="commit-detail-summary">
        <span>{{ totals.files }} file<template v-if="totals.files !== 1">s</template></span>
        <span class="adds">+{{ totals.additions }}</span>
        <span class="dels">-{{ totals.deletions }}</span>
      </section>

      <p v-if="files.length === 0" class="commit-detail-state">
        This commit has no textual diff. (Merge, empty, or binary-only change.)
      </p>

      <ol v-else class="diff-files">
        <li
          v-for="(file, index) in files"
          :key="file.displayPath + index"
          class="diff-file"
        >
          <header
            class="diff-file-head"
            role="button"
            tabindex="0"
            :aria-expanded="!isCollapsed(file.displayPath)"
            @click="toggleFile(file.displayPath)"
            @keydown.enter.prevent="toggleFile(file.displayPath)"
            @keydown.space.prevent="toggleFile(file.displayPath)"
          >
            <span class="caret">{{ isCollapsed(file.displayPath) ? "▸" : "▾" }}</span>
            <span :class="['file-status', `status-${file.status}`]">{{ fileBadge(file) }}</span>
            <code class="file-path">{{ file.displayPath }}</code>
            <span v-if="file.status === 'renamed' && file.oldPath !== file.newPath" class="file-rename">
              from <code>{{ file.oldPath }}</code>
            </span>
            <span class="file-counts">
              <span class="adds">+{{ file.additions }}</span>
              <span class="dels">-{{ file.deletions }}</span>
            </span>
          </header>

          <div v-if="!isCollapsed(file.displayPath)" class="diff-file-body">
            <p v-if="file.binary" class="muted">Binary file — no preview.</p>
            <template v-else>
              <section v-for="(hunk, hIndex) in file.hunks" :key="hIndex" class="diff-hunk">
                <header class="diff-hunk-head">
                  <code>{{ hunk.header.replace(/^@@ /, "").replace(/ @@.*$/, "") }}</code>
                </header>
                <table>
                  <tbody>
                    <tr
                      v-for="(line, lIndex) in hunk.lines"
                      :key="lIndex"
                      :class="['diff-line', `line-${line.kind}`]"
                    >
                      <td class="ln old">{{ line.oldNumber ?? "" }}</td>
                      <td class="ln new">{{ line.newNumber ?? "" }}</td>
                      <td class="marker">
                        <template v-if="line.kind === 'add'">+</template>
                        <template v-else-if="line.kind === 'del'">-</template>
                        <template v-else-if="line.kind === 'meta'">\</template>
                        <template v-else> </template>
                      </td>
                      <td class="content">{{ line.text }}</td>
                    </tr>
                  </tbody>
                </table>
              </section>
            </template>
          </div>
        </li>
      </ol>
    </template>
  </section>
</template>
