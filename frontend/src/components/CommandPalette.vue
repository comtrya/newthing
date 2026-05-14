<script setup lang="ts">
/**
 * Command palette — Headless UI Combobox under the hood.
 *
 * Owns: shell-side rendering, fuzzy filter, group rendering, the
 * editorial visual design. Defers to the library for: focus trap,
 * focus restoration, arrow-key nav, Enter to select, Escape to close,
 * click-outside, aria roles and labels. Cmd-K opens via
 * `bindGlobalShortcut` (tinykeys, in sdk-core).
 *
 * Migration note: before iteration 21 this was a hand-rolled
 * `Teleport` + `<input>` + `<button>` list with a bespoke
 * keydown handler. That code is gone; the surface is half its
 * previous size and the keyboard semantics now match the rest of
 * the Linear-adjacent ecosystem (cmdk, kbar, vue-command-palette
 * all sit on the same primitives).
 */

import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import {
  Combobox,
  ComboboxInput,
  ComboboxOptions,
  ComboboxOption,
  Dialog,
  DialogPanel,
  TransitionRoot,
  TransitionChild,
} from "@headlessui/vue";
import {
  configurePaletteOpener,
  filterCommands,
  listCommands,
  subscribeCommands,
  type CommandContribution,
} from "@comtrya/sdk-core";

const open = ref(false);
const query = ref("");
const commands = ref<CommandContribution[]>([]);
let unsubscribe: (() => void) | undefined;

const filteredCommands = computed(() => filterCommands(query.value, commands.value));

interface CommandGroup {
  category: string;
  commands: CommandContribution[];
}

const grouped = computed<CommandGroup[]>(() => {
  const map = new Map<string, CommandContribution[]>();
  for (const cmd of filteredCommands.value) {
    const key = cmd.category ?? cmd.extensionId;
    const bucket = map.get(key) ?? [];
    bucket.push(cmd);
    map.set(key, bucket);
  }
  return Array.from(map.entries()).map(([category, commands]) => ({
    category,
    commands,
  }));
});

onMounted(() => {
  refreshCommands();
  unsubscribe = subscribeCommands(refreshCommands);
  configurePaletteOpener(() => {
    query.value = "";
    open.value = true;
  });
});

onUnmounted(() => {
  unsubscribe?.();
});

watch(open, (isOpen) => {
  if (!isOpen) query.value = "";
});

function refreshCommands(): void {
  commands.value = listCommands();
}

function closePalette(): void {
  open.value = false;
}

async function onSelect(command: CommandContribution | null): Promise<void> {
  if (!command) return;
  closePalette();
  await command.run();
}
</script>

<template>
  <TransitionRoot :show="open" as="template" appear>
    <Dialog class="palette-dialog" @close="closePalette">
      <TransitionChild
        as="template"
        enter="palette-fade-enter"
        enter-from="palette-fade-from"
        enter-to="palette-fade-to"
        leave="palette-fade-leave"
        leave-from="palette-fade-to"
        leave-to="palette-fade-from"
      >
        <div class="palette-backdrop" aria-hidden="true" />
      </TransitionChild>

      <div class="palette-positioner">
        <TransitionChild
          as="template"
          enter="palette-pop-enter"
          enter-from="palette-pop-from"
          enter-to="palette-pop-to"
          leave="palette-pop-leave"
          leave-from="palette-pop-to"
          leave-to="palette-pop-from"
        >
          <DialogPanel class="palette-panel">
            <Combobox @update:model-value="onSelect" nullable>
              <ComboboxInput
                class="palette-input"
                placeholder="Search commands"
                autocomplete="off"
                spellcheck="false"
                :display-value="() => ''"
                @change="query = ($event.target as HTMLInputElement).value"
              />

              <ComboboxOptions
                class="palette-list"
                static
              >
                <template v-for="group in grouped" :key="group.category">
                  <header class="palette-group">{{ group.category }}</header>
                  <ComboboxOption
                    v-for="command in group.commands"
                    :key="command.id"
                    v-slot="{ active }"
                    :value="command"
                    as="template"
                  >
                    <li
                      :class="['palette-command', { active }]"
                      :data-smoke="`palette-cmd-${command.id}`"
                    >
                      <span class="palette-title">{{ command.title }}</span>
                      <span class="palette-meta">
                        <kbd v-if="command.shortcut">{{ command.shortcut }}</kbd>
                        <code>{{ command.category ?? command.extensionId }}</code>
                      </span>
                    </li>
                  </ComboboxOption>
                </template>
                <p v-if="filteredCommands.length === 0" class="palette-empty">
                  No commands match "{{ query }}"
                </p>
              </ComboboxOptions>

              <footer class="palette-foot">
                <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
                <span><kbd>↵</kbd> run</span>
                <span><kbd>Esc</kbd> close</span>
              </footer>
            </Combobox>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<style scoped>
.palette-dialog {
  position: fixed;
  inset: 0;
  z-index: 100;
}

.palette-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(20, 18, 14, 0.32);
}

.palette-positioner {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: start center;
  padding: 12vh 24px 24px;
  pointer-events: none;
}

.palette-panel {
  pointer-events: auto;
  width: min(680px, calc(100vw - 48px));
  background: var(--paper, #fffdf8);
  border: 1.5px solid var(--ink, #111);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  max-height: min(70vh, 720px);
  box-shadow: 0 30px 60px -20px rgba(20, 18, 14, 0.45);
}

.palette-input {
  width: 100%;
  border: 0;
  border-bottom: 1.5px solid var(--ink, #111);
  background: transparent;
  font-family: var(--display, system-ui);
  font-size: 18px;
  padding: 14px 18px;
  color: var(--ink, #111);
  outline: none;
}

.palette-input::placeholder {
  color: var(--ink-fainter, #918b80);
  font-style: italic;
}

.palette-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.palette-list:focus-visible,
.palette-list:focus {
  outline: none;
}

.palette-group {
  font-family: var(--mono, monospace);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-faint, #68645c);
  padding: 10px 18px 4px;
  background: var(--paper-tint, #f2efe7);
  border-bottom: 1px solid var(--rule-light, #d8d1c4);
}

.palette-command {
  min-height: 44px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 8px 18px;
  color: var(--ink, #111);
  cursor: pointer;
  border-bottom: 1px solid var(--rule-light, #d8d1c4);
  user-select: none;
}

.palette-command.active {
  background: var(--paper-tint, #f2efe7);
}

.palette-command.active .palette-title {
  font-weight: 600;
}

.palette-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--display, system-ui);
  font-size: 14px;
}

.palette-meta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.palette-meta kbd {
  border: 1px solid var(--ink, #111);
  padding: 1px 6px;
  font-family: var(--mono, monospace);
  font-size: 10px;
  color: var(--ink, #111);
  background: var(--paper, #fffdf8);
}

.palette-meta code {
  font-family: var(--mono, monospace);
  font-size: 11px;
  color: var(--ink-faint, #68645c);
  letter-spacing: 0.02em;
}

.palette-empty {
  margin: 0;
  padding: 20px 18px;
  font-family: var(--mono, monospace);
  font-size: 12px;
  color: var(--ink-faint, #68645c);
}

.palette-foot {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  justify-content: flex-end;
  border-top: 1.5px solid var(--ink, #111);
  padding: 8px 16px;
  background: var(--paper-tint, #f2efe7);
  font-family: var(--mono, monospace);
  font-size: 10px;
  color: var(--ink-faint, #68645c);
}

.palette-foot kbd {
  border: 1px solid var(--ink, #111);
  padding: 0 4px;
  font-family: var(--mono, monospace);
  font-size: 10px;
  color: var(--ink, #111);
  margin-right: 4px;
}

.palette-fade-enter,
.palette-fade-leave { transition: opacity 120ms ease; }
.palette-fade-from { opacity: 0; }
.palette-fade-to { opacity: 1; }

.palette-pop-enter,
.palette-pop-leave { transition: opacity 120ms ease, transform 120ms ease; }
.palette-pop-from { opacity: 0; transform: translateY(-6px) scale(0.985); }
.palette-pop-to { opacity: 1; transform: translateY(0) scale(1); }
</style>
