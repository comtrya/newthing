<script setup lang="ts">
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

const groups: ShortcutGroup[] = [
  {
    title: "Global",
    shortcuts: [
      { keys: ["%cmd%", "K"], description: "Open command palette" },
      { keys: ["?"], description: "Show / hide this cheat sheet" },
      { keys: ["g", "h"], description: "Go to workspace home" },
      { keys: ["g", "r"], description: "Go to the first repository" },
      { keys: ["g", "i"], description: "Go to issues" },
      { keys: ["g", "p"], description: "Go to pull requests" },
      { keys: ["g", "n"], description: "New repository" },
    ],
  },
  {
    title: "Lists (issues, pulls)",
    shortcuts: [
      { keys: ["j"], description: "Move focus down" },
      { keys: ["k"], description: "Move focus up" },
      { keys: ["↵"], description: "Open the focused row" },
      { keys: ["/"], description: "Focus search field" },
      { keys: ["o"], description: "Show open items" },
      { keys: ["m"], description: "Show merged / closed items" },
      { keys: ["a"], description: "Show all items" },
    ],
  },
  {
    title: "Pull request detail",
    shortcuts: [
      { keys: ["m"], description: "Merge the pull request" },
      { keys: ["x"], description: "Close the pull request" },
      { keys: ["Esc"], description: "Back to queue" },
    ],
  },
];
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
          <section v-for="group in groups" :key="group.title">
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
  background: rgba(10, 10, 10, 0.22);
}

.shortcuts-panel {
  width: min(720px, calc(100vw - 32px));
  max-height: 80vh;
  overflow: auto;
  background: var(--paper, #fffdf8);
  border: 2px solid var(--ink, #111);
  color: var(--ink, #111);
}

.shortcuts-panel header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1.5px solid var(--ink, #111);
  padding: 14px 18px;
}

.shortcuts-panel h2 {
  margin: 0;
  font-family: var(--display, system-ui);
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
  font-family: var(--mono, monospace);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-faint, #68645c);
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
  border: 1.5px solid var(--ink, #111);
  padding: 1px 6px;
  font-family: var(--mono, monospace);
  font-size: 11px;
  background: var(--paper, #fffdf8);
  color: var(--ink, #111);
  min-width: 18px;
  text-align: center;
}

.sep {
  font-family: var(--mono, monospace);
  font-size: 11px;
  color: var(--ink-faint, #68645c);
}

dd {
  margin: 0;
  font-family: var(--sans, system-ui);
  font-size: 13px;
}
</style>
