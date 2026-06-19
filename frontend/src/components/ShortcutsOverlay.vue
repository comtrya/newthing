<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { listCommands, subscribeCommands, type CommandContribution } from "@comtrya/sdk-core";

defineProps<{
  cmdLabel: string;
}>();

const emit = defineEmits<{
  (event: "close"): void;
}>();

interface ShortcutGroup {
  title: string;
  shortcuts: Array<{ keys: string[]; description: string }>;
}

/**
 * Static cheat sheet for keyboard shortcuts that are scoped per
 * component (j/k inside lists, m/x on PullsDetail, etc.) — these
 * aren't in the global command registry because they only make
 * sense when the relevant surface is focused. The dynamic
 * "Commands" group below sources every `registerCommand` entry
 * with a `.shortcut` from the live registry.
 */
const staticGroups: ShortcutGroup[] = [
  {
    title: "Global (always)",
    shortcuts: [
      { keys: ["%cmd%", "K"], description: "Open command palette" },
      { keys: ["?"], description: "Show / hide this cheat sheet" },
      { keys: ["c"], description: "Comment on this surface — or create new (Inbox, detail pages)" },
    ],
  },
  {
    title: "Inside a repository",
    shortcuts: [
      { keys: ["g", "o"], description: "Overview" },
      { keys: ["g", "c"], description: "Code" },
      { keys: ["g", "i"], description: "Issues" },
      { keys: ["g", "p"], description: "Pull requests" },
      { keys: ["g", "e"], description: "Epics" },
      { keys: ["g", "k"], description: "Checks" },
      { keys: ["g", "f"], description: "Config" },
    ],
  },
  {
    title: "Lists (issues, pull requests, epics)",
    shortcuts: [
      { keys: ["j"], description: "Move focus down" },
      { keys: ["k"], description: "Move focus up" },
      { keys: ["↵"], description: "Open the focused row" },
      { keys: ["/"], description: "Focus search field" },
      { keys: ["c"], description: "Focus the inline quick-add" },
      { keys: ["o"], description: "Show open items" },
      { keys: ["x"], description: "Show closed items (issues)" },
      { keys: ["a"], description: "Show all items" },
    ],
  },
  {
    title: "Issue / epic detail",
    shortcuts: [
      { keys: ["j"], description: "Move focus down (issue rows in epic)" },
      { keys: ["k"], description: "Move focus up" },
      { keys: ["↵"], description: "Open the focused entity" },
      { keys: ["Esc"], description: "Clear focus / close overlay" },
    ],
  },
  {
    title: "Pull request detail",
    shortcuts: [
      { keys: ["m"], description: "Merge the pull request" },
      { keys: ["x"], description: "Close the pull request" },
      { keys: ["n"], description: "Next file in diff" },
      { keys: ["p"], description: "Previous file in diff" },
      { keys: ["["], description: "Collapse file" },
      { keys: ["]"], description: "Expand file" },
      { keys: ["Esc"], description: "Back to pull requests" },
    ],
  },
];

/**
 * Live snapshot of every command registered via `registerCommand`
 * that has a `.shortcut` field. Subscribes to the registry so the
 * overlay reflects whatever's currently registered (dynamic
 * Project + Repository + entity commands count too).
 */
const commands = ref<CommandContribution[]>([]);
let unsubscribe: (() => void) | undefined;

function refresh(): void {
  commands.value = listCommands();
}

onMounted(() => {
  refresh();
  unsubscribe = subscribeCommands(refresh);
});

onUnmounted(() => {
  unsubscribe?.();
});

interface CommandGroup {
  category: string;
  entries: Array<{ keys: string[]; description: string }>;
}

const commandGroups = computed<CommandGroup[]>(() => {
  const byCategory = new Map<string, Array<{ keys: string[]; description: string }>>();
  for (const cmd of commands.value) {
    if (!cmd.shortcut) continue;
    const keys = cmd.shortcut.split(/\s+/);
    const category = cmd.category ?? cmd.extensionId;
    const bucket = byCategory.get(category) ?? [];
    bucket.push({ keys, description: cmd.title });
    byCategory.set(category, bucket);
  }
  return Array.from(byCategory.entries())
    .map(([category, entries]) => ({ category, entries }))
    .sort((a, b) => a.category.localeCompare(b.category));
});
</script>

<template>
  <Teleport to="body">
    <div class="shortcuts-backdrop" @click.self="emit('close')">
      <section
        class="shortcuts-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
      >
        <header>
          <h2>Keyboard shortcuts</h2>
          <button type="button" class="close" aria-label="Close" @click="emit('close')">×</button>
        </header>

        <div class="groups">
          <section
            v-for="group in commandGroups"
            :key="`cmd-${group.category}`"
            class="group group-live"
          >
            <h3>
              {{ group.category }}
              <span class="live-badge" title="Sourced from the live command registry">live</span>
            </h3>
            <dl>
              <template v-for="entry in group.entries" :key="entry.description">
                <dt>
                  <template v-for="(key, i) in entry.keys" :key="i">
                    <kbd>{{ key === "%cmd%" ? cmdLabel : key }}</kbd>
                    <span v-if="i < entry.keys.length - 1" class="sep">·</span>
                  </template>
                </dt>
                <dd>{{ entry.description }}</dd>
              </template>
            </dl>
          </section>

          <section v-for="group in staticGroups" :key="`static-${group.title}`" class="group">
            <h3>{{ group.title }}</h3>
            <dl>
              <template v-for="entry in group.shortcuts" :key="entry.description">
                <dt>
                  <template v-for="(key, i) in entry.keys" :key="i">
                    <kbd>{{ key === "%cmd%" ? cmdLabel : key }}</kbd>
                    <span v-if="i < entry.keys.length - 1" class="sep">+</span>
                  </template>
                </dt>
                <dd>{{ entry.description }}</dd>
              </template>
            </dl>
          </section>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.shortcuts-backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 32px;
  background: rgba(0, 0, 0, 0.5);
}

.shortcuts-panel {
  width: min(720px, calc(100vw - 32px));
  max-height: 80vh;
  overflow: auto;
  background: var(--glass);
  backdrop-filter: blur(22px) saturate(140%);
  border: 0.5px solid var(--line-2);
  border-radius: var(--r-lg);
  color: var(--fg);
}

.shortcuts-panel header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 0.5px solid var(--line);
  padding: 14px 18px;
}

.shortcuts-panel h2 {
  margin: 0;
  font-family: var(--font-sans);
  font-size: 18px;
}

.close {
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 22px;
  cursor: pointer;
  line-height: 1;
}

.groups {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px 24px;
  padding: 18px;
}

.groups h3 {
  margin: 0 0 8px;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--fg-3);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.live-badge {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.06em;
  text-transform: lowercase;
  color: var(--ok);
  border: 0.5px solid currentColor;
  border-radius: var(--r-xs);
  padding: 0 4px;
  cursor: help;
}

dl {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px 14px;
  margin: 0;
}

dt {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

dt kbd {
  border: 0.5px solid var(--line-2);
  border-radius: var(--r-xs);
  padding: 1px 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  background: var(--surface);
  color: var(--fg);
  min-width: 18px;
  text-align: center;
}

.sep {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--fg-3);
}

dd {
  margin: 0;
  font-family: var(--font-sans);
  font-size: 13px;
}
</style>
