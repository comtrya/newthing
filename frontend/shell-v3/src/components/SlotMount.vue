<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import {
  slotsFor,
  subscribeSlots,
  type SlotContribution,
} from "@comtrya/sdk-core";

const props = defineProps<{
  name: string;
  label: string;
}>();

const contributions = ref<SlotContribution[]>([]);
let unsubscribe: (() => void) | undefined;

function refresh(): void {
  contributions.value = [...slotsFor(props.name)];
}

onMounted(() => {
  refresh();
  unsubscribe = subscribeSlots((slot) => {
    if (slot === props.name) refresh();
  });
});

watch(() => props.name, refresh);
onUnmounted(() => unsubscribe?.());
</script>

<template>
  <section class="slot-frame" :data-smoke="`workspace-home-slot-${name}`">
    <header class="slot-heading">
      <h2>{{ label }}</h2>
      <code>{{ name }}</code>
    </header>
    <div class="slot-mount" :data-extension-slot-mount="name">
      <component
        :is="entry.element"
        v-for="entry in contributions"
        :key="entry.id"
        :data-extension-id="entry.extensionId"
        :data-extension-slot="name"
      />
      <article v-if="contributions.length === 0" class="slot-placeholder">
        <span>No extension claims this slot</span>
      </article>
    </div>
  </section>
</template>
