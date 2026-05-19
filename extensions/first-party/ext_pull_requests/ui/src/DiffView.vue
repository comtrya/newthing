<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useShortcuts } from "@comtrya/sdk-vue";
import { parseUnifiedDiff, summarize, type DiffFile } from "./diff";
import { ensureDiffStyles } from "./diff-styles";

ensureDiffStyles();

const props = defineProps<{
  patch: string;
  loading?: boolean;
  error?: string | null;
}>();

const collapsed = ref<Record<string, boolean>>({});
const focusedFile = ref(0);

const files = computed<DiffFile[]>(() => parseUnifiedDiff(props.patch));
const totals = computed(() => summarize(files.value));

watch(files, (next) => {
  if (focusedFile.value >= next.length) focusedFile.value = Math.max(0, next.length - 1);
});

useShortcuts({
  "]": (event) => {
    if (files.value.length === 0) return;
    event.preventDefault();
    focusFile(Math.min(focusedFile.value + 1, files.value.length - 1));
  },
  n: (event) => {
    if (files.value.length === 0) return;
    event.preventDefault();
    focusFile(Math.min(focusedFile.value + 1, files.value.length - 1));
  },
  "[": (event) => {
    if (files.value.length === 0) return;
    event.preventDefault();
    focusFile(Math.max(focusedFile.value - 1, 0));
  },
  p: (event) => {
    if (files.value.length === 0) return;
    event.preventDefault();
    focusFile(Math.max(focusedFile.value - 1, 0));
  },
  " ": (event) => {
    const file = files.value[focusedFile.value];
    if (!file) return;
    event.preventDefault();
    toggleFile(file.displayPath);
  },
});

function toggleFile(path: string): void {
  collapsed.value[path] = !collapsed.value[path];
}

function isCollapsed(path: string): boolean {
  return collapsed.value[path] === true;
}

function fileBadge(file: DiffFile): string {
  switch (file.status) {
    case "added":
      return "added";
    case "deleted":
      return "deleted";
    case "renamed":
      return "renamed";
    default:
      return "modified";
  }
}

function focusFile(index: number): void {
  if (index < 0 || index >= files.value.length) return;
  focusedFile.value = index;
  const target = document.querySelector<HTMLElement>(`[data-diff-file-index="${index}"]`);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

</script>

<template>
  <section class="diff-view" data-smoke="pulls-diff-view">
    <header class="diff-summary">
      <h2>Files changed</h2>
      <div class="diff-totals">
        <span>{{ totals.files }} file<template v-if="totals.files !== 1">s</template></span>
        <span class="adds">+{{ totals.additions }}</span>
        <span class="dels">-{{ totals.deletions }}</span>
        <span class="hint">
          <kbd>n</kbd>/<kbd>p</kbd> next/prev file ·
          <kbd>space</kbd> collapse
        </span>
      </div>
    </header>

    <p v-if="loading" class="muted">Loading diff…</p>
    <p v-else-if="error" class="muted error">{{ error }}</p>
    <p v-else-if="files.length === 0" class="muted">
      No diff to show. Push commits to head and base refs to populate this view.
    </p>

    <ol v-else class="diff-files">
      <li
        v-for="(file, index) in files"
        :key="file.displayPath + index"
        :class="['diff-file', { focused: index === focusedFile }]"
        :data-diff-file-index="index"
      >
        <header
          class="diff-file-head"
          tabindex="0"
          role="button"
          :aria-expanded="!isCollapsed(file.displayPath)"
          @click="toggleFile(file.displayPath)"
          @keydown.enter.prevent="toggleFile(file.displayPath)"
          @focus="focusedFile = index"
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
                <code>{{ hunk.header.replace(/^@@ /, "").replace(/ @@$/, "") }}</code>
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
  </section>
</template>

