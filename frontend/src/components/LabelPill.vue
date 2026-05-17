<script setup lang="ts">
import { computed } from "vue";

/**
 * Renders a single label as a GitLab-style pill. The label is a
 * string in one of three wire forms:
 *
 *   • Plain:               "bug"            → one segment
 *   • Typed non-exclusive: "kind::ux"       → [type] :: [value]
 *   • Typed exclusive:     "priority!!p0"   → [type] !! [value]
 *
 * The catalog (optional) carries per-label presentation hints
 * (color, description). When the catalog has no entry for this
 * label the pill still renders cleanly from the wire string alone
 * — the catalog only enriches.
 */

export interface LabelCatalogEntry {
  name?: string;
  type?: string;
  value?: string;
  exclusive?: boolean;
  color?: string;
  description?: string;
}

export interface LabelCatalog {
  [wireName: string]: LabelCatalogEntry;
}

const props = defineProps<{
  name: string;
  catalog?: LabelCatalog | null;
}>();

interface Parsed {
  kind: "plain" | "typed" | "exclusive";
  type: string;
  value: string;
}

const parsed = computed<Parsed>(() => {
  const exclusiveSplit = props.name.split("!!");
  if (exclusiveSplit.length === 2 && exclusiveSplit[0] && exclusiveSplit[1]) {
    return { kind: "exclusive", type: exclusiveSplit[0], value: exclusiveSplit[1] };
  }
  const typedSplit = props.name.split("::");
  if (typedSplit.length === 2 && typedSplit[0] && typedSplit[1]) {
    return { kind: "typed", type: typedSplit[0], value: typedSplit[1] };
  }
  return { kind: "plain", type: "", value: props.name };
});

const entry = computed<LabelCatalogEntry | null>(() => {
  if (!props.catalog) return null;
  return props.catalog[props.name] ?? null;
});

const color = computed<string | null>(() => entry.value?.color ?? null);
const description = computed<string | null>(
  () => entry.value?.description ?? null,
);
</script>

<template>
  <span
    class="label-pill"
    :class="[`label-pill--${parsed.kind}`]"
    :title="description ?? undefined"
    :style="color ? { '--label-color': color } : undefined"
  >
    <template v-if="parsed.kind === 'plain'">
      <span class="label-pill-value">{{ parsed.value }}</span>
    </template>
    <template v-else>
      <span class="label-pill-type">{{ parsed.type }}</span>
      <span class="label-pill-sep" aria-hidden="true">{{
        parsed.kind === "exclusive" ? "!!" : "::"
      }}</span>
      <span class="label-pill-value">{{ parsed.value }}</span>
    </template>
  </span>
</template>
