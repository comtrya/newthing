<script setup lang="ts">
import { computed } from "vue";

/**
 * Renders a single label as a GitLab-style pill.
 *
 * Wire form is always one of:
 *   • Plain:  "bug"            → one segment, no `type::` prefix.
 *   • Typed:  "kind::ux"       → [type] :: [value]. The same
 *             separator is used whether the label is scoped
 *             (multi-value) or exclusive (single-value); the
 *             catalog entry's `kind` field is what tells
 *             consumers which it is.
 *
 * The catalog (optional) is the source of truth for label kind
 * AND presentation hints (color, description). Without a catalog,
 * the pill falls back to inferring `plain` vs `scoped` from the
 * string shape and defaults the kind to scoped for typed labels.
 */

export type LabelKind = "plain" | "scoped" | "exclusive";

export interface LabelCatalogEntry {
  kind?: LabelKind;
  name?: string;
  type?: string;
  value?: string;
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
  kind: LabelKind;
  type: string;
  value: string;
}

const entry = computed<LabelCatalogEntry | null>(() => {
  if (!props.catalog) return null;
  return props.catalog[props.name] ?? null;
});

const parsed = computed<Parsed>(() => {
  const split = props.name.split("::");
  const isTyped = split.length === 2 && !!split[0] && !!split[1];
  const catalogKind = entry.value?.kind;
  if (isTyped) {
    const kind: LabelKind = catalogKind ?? "scoped";
    return { kind, type: split[0]!, value: split[1]! };
  }
  return { kind: "plain", type: "", value: props.name };
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
      <span class="label-pill-sep" aria-hidden="true">::</span>
      <span class="label-pill-value">{{ parsed.value }}</span>
    </template>
  </span>
</template>
