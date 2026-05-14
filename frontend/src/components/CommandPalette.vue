<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
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

onMounted(() => {
  refreshCommands();
  unsubscribe = subscribeCommands(refreshCommands);
  configurePaletteOpener(() => {
    query.value = "";
    open.value = true;
  });
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  unsubscribe?.();
  window.removeEventListener("keydown", handleKeydown);
});

function refreshCommands(): void {
  commands.value = listCommands();
}

function closePalette(): void {
  open.value = false;
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape" && open.value) {
    event.preventDefault();
    closePalette();
  }
}

async function runCommand(command: CommandContribution): Promise<void> {
  await command.run();
  closePalette();
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="palette-backdrop" @click.self="closePalette">
      <section class="command-palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <input
          v-model="query"
          class="palette-input"
          type="search"
          autofocus
          placeholder="Search commands"
        />
        <div class="palette-list">
          <button
            v-for="command in filteredCommands"
            :key="command.id"
            type="button"
            class="palette-command"
            @click="runCommand(command)"
          >
            <span>{{ command.title }}</span>
            <code>{{ command.category ?? command.extensionId }}</code>
          </button>
          <article v-if="filteredCommands.length === 0" class="palette-empty">
            No commands
          </article>
        </div>
      </section>
    </div>
  </Teleport>
</template>
