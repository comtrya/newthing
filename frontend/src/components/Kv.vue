<script setup lang="ts">
defineProps<{ k: string }>();
</script>

<template>
  <div class="kv">
    <div class="kv-key">{{ k }}</div>
    <div class="kv-val"><slot /></div>
  </div>
</template>

<style scoped>
.kv {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.kv-key {
  font-size: 10px;
  color: var(--fg-4);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.kv-val {
  font-size: 12px;
  color: var(--fg);
}
</style>
