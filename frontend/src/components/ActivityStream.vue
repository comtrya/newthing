<script setup lang="ts">
/**
 * Real-time activity stream.
 *
 * Mounts the kernel SSE (`subscribeLiveEvents`) and renders every issue,
 * pull-request, comment, repository, and relation transition as a single
 * dense, scannable feed. The forge's "what just happened" surface.
 *
 * The SSE delivers events in real time; we also bootstrap from the
 * `workspace { events }` GraphQL field so opening the page does not show
 * an empty feed.
 */

import { computed, onMounted, onUnmounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { getGraphQLClient, subscribeLiveEvents, type LiveEvent } from "@comtrya/sdk-core";
import { activityEmptyStateCopy } from "../activity-empty-state";

const ACCESS_TOKEN_STORAGE_KEY = "comtrya.accessToken";

/**
 * Optional Project scope. When set, the stream renders only events
 * whose payload carries a matching `projectName` field (issues +
 * epics have stamped this since iteration 10/11). Events without a
 * `projectName` are dropped — workspace-global noise doesn't bleed
 * into a Project's "what just happened" feed. Without the prop, the
 * stream stays workspace-global (the workspace home shape).
 *
 * Optional repository scope. When set, the stream renders only
 * events tagged with a matching `repositoryID` on the payload. This
 * is what the repo home uses to surface the repo's "what just
 * happened" feed alongside the README without dragging in
 * workspace-wide noise. Project and repository scopes compose — if
 * both props are set, an event must match both.
 */
const props = defineProps<{
  projectName?: string;
  repositoryId?: string;
}>();

interface ActivityItem {
  id: string;
  eventType: string;
  timestampMs: number;
  source: string;
  emitter: string;
  payload: Record<string, unknown> | null;
  isNew: boolean;
}

const events = ref<ActivityItem[]>([]);
const status = ref<"connecting" | "live" | "idle" | "error">("connecting");
const error = ref<string | null>(null);
const focusedIndex = ref(0);
const hasLiveSession = ref(false);

const statusLabel = computed(() => {
  switch (status.value) {
    case "connecting":
      return "Connecting";
    case "live":
      return "Live";
    case "error":
      return "Error";
    case "idle":
    default:
      return "Idle";
  }
});

let unsubscribe: (() => void) | undefined;
let highlightTimers: number[] = [];

// Pre-format all filtered items once so the template doesn't call
// formatItem() 6 times per row — once per property access (tone, href x2,
// iconLabel, verb, subject). Closes #113.
const formattedFiltered = computed(() =>
  filtered.value.map((item) => ({ item, fmt: formatItem(item) }))
);

const emptyState = computed(() =>
  filtered.value.length === 0
    ? activityEmptyStateCopy({
        status: status.value,
        error: error.value,
        hasSession: hasLiveSession.value,
      })
    : null,
);

const filtered = computed(() => {
  const wantedProject = props.projectName;
  const wantedRepo = props.repositoryId;
  if (!wantedProject && !wantedRepo) return events.value;
  return events.value.filter((item) => {
    const payload =
      item.payload && typeof item.payload === "object"
        ? (item.payload as Record<string, unknown>)
        : null;
    if (wantedProject) {
      const project = payload?.projectName;
      if (typeof project !== "string" || project !== wantedProject) return false;
    }
    if (wantedRepo) {
      const repo =
        payload?.repositoryID ??
        payload?.repositoryId ??
        payload?.repositoryUlid;
      if (typeof repo !== "string" || repo !== wantedRepo) return false;
    }
    return true;
  });
});

onMounted(() => {
  void bootstrap();
  const token = window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) ?? undefined;
  hasLiveSession.value = Boolean(token);
  if (!token) {
    status.value = "idle";
    return;
  }
  unsubscribe = subscribeLiveEvents({
    token,
    onEvent: (event) => {
      status.value = "live";
      ingest(toActivityItem(event, true));
    },
    onError: () => {
      status.value = "error";
      error.value = "Live stream disconnected.";
    },
  });
  window.setTimeout(() => {
    if (status.value === "connecting") status.value = "idle";
  }, 1500);
});

onUnmounted(() => {
  unsubscribe?.();
  for (const id of highlightTimers) window.clearTimeout(id);
  highlightTimers = [];
});

async function bootstrap(): Promise<void> {
  try {
    const data = await getGraphQLClient().query<{
      viewer?: { authenticated?: boolean };
      workspace?: { events?: unknown[] };
    }>("{ viewer { authenticated } workspace { events } }");
    hasLiveSession.value =
      hasLiveSession.value || data.viewer?.authenticated === true;
    const initial = (data.workspace?.events ?? [])
      .map((raw) => {
        const live = normalizeBootstrapEvent(raw);
        return live ? toActivityItem(live, false) : null;
      })
      .filter((value): value is ActivityItem => value !== null);
    if (initial.length > 0) {
      events.value = sortAndDedupe([...initial, ...events.value]);
    }
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : String(caught);
  }
}

function ingest(item: ActivityItem): void {
  events.value = sortAndDedupe([item, ...events.value]).slice(0, 200);
  if (item.isNew) {
    const id = window.setTimeout(() => {
      const idx = events.value.findIndex((e) => e.id === item.id);
      if (idx >= 0) events.value[idx]!.isNew = false;
    }, 4000);
    highlightTimers.push(id);
  }
}

function sortAndDedupe(input: ActivityItem[]): ActivityItem[] {
  const seen = new Set<string>();
  const out: ActivityItem[] = [];
  for (const event of input) {
    const key = event.id || `${event.eventType}-${event.timestampMs}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(event);
  }
  return out.sort((a, b) => b.timestampMs - a.timestampMs);
}

function toActivityItem(event: LiveEvent, isNew: boolean): ActivityItem {
  return {
    id: event.id || `${event.eventType}-${event.timestampMs}`,
    eventType: event.eventType,
    timestampMs: event.timestampMs || Date.now(),
    source: event.sourceUri || event.emitterExtension,
    emitter: event.emitterExtension,
    payload: decodePayload(event.payloadB64) ?? extractPayload(event.raw),
    isNew,
  };
}

function normalizeBootstrapEvent(raw: unknown): LiveEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const eventType =
    typeof value.eventType === "string"
      ? value.eventType
      : typeof value.type === "string"
        ? value.type
        : "";
  if (!eventType) return null;
  const timestampMs =
    typeof value.timestampMs === "number"
      ? value.timestampMs
      : typeof value.time === "number"
        ? value.time * 1000
        : typeof value.timestamp === "string"
          ? Date.parse(value.timestamp)
          : Date.now();
  return {
    id: typeof value.id === "string" ? value.id : "",
    eventType,
    payloadB64: typeof value.payloadB64 === "string" ? value.payloadB64 : "",
    timestampMs: Number.isFinite(timestampMs) ? timestampMs : Date.now(),
    sourceUri:
      typeof value.sourceUri === "string"
        ? value.sourceUri
        : typeof value.source === "string"
          ? value.source
          : "",
    emitterExtension:
      typeof value.emitterExtension === "string"
        ? value.emitterExtension
        : typeof value.extensionId === "string"
          ? value.extensionId
          : "",
    raw,
  };
}

function decodePayload(payloadB64: string): Record<string, unknown> | null {
  if (!payloadB64) return null;
  try {
    const text = atob(payloadB64);
    const parsed = JSON.parse(text) as unknown;
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function extractPayload(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const data = value.data;
  if (data && typeof data === "object") return data as Record<string, unknown>;
  const payload = value.payload;
  if (payload && typeof payload === "object") return payload as Record<string, unknown>;
  return value;
}

interface FormattedActivity {
  verb: string;
  subject: string;
  href: string | null;
  tone: "open" | "closed" | "merged" | "neutral";
  iconLabel: string;
}

function formatItem(item: ActivityItem): FormattedActivity {
  const payload = item.payload ?? {};
  const title = stringField(payload, "title") ?? stringField(payload, "name") ?? "";
  const number = numberField(payload, "number");
  const id = stringField(payload, "id");
  const repository = stringField(payload, "repository");
  const path = stringField(payload, "path") ?? stringField(payload, "repositoryPath");

  switch (item.eventType) {
    case "dev.comtrya.issues.opened":
      return activity("opened issue", labelWithNumber(title, number, "issue"), issueHref(id, number), "open", "I");
    case "dev.comtrya.issues.closed":
      return activity("closed issue", labelWithNumber(title, number, "issue"), issueHref(id, number), "closed", "I");
    case "dev.comtrya.issues.reopened":
      return activity("reopened issue", labelWithNumber(title, number, "issue"), issueHref(id, number), "open", "I");
    case "dev.comtrya.pull-request.created":
      return activity("opened pull request", labelWithNumber(title, number, "pull"), pullHref(id), "open", "P");
    case "dev.comtrya.pull-request.merged":
      return activity("merged pull request", labelWithNumber(title, number, "pull"), pullHref(id), "merged", "P");
    case "dev.comtrya.pull-request.closed":
      return activity("closed pull request", labelWithNumber(title, number, "pull"), pullHref(id), "closed", "P");
    case "dev.comtrya.epic.created":
      return activity("created epic", title || "epic", null, "open", "E");
    case "dev.comtrya.epic.state-changed":
      return activity("changed epic state", title || "epic", null, "neutral", "E");
    case "dev.comtrya.comment.posted":
      return activity("commented", stringField(payload, "body")?.slice(0, 80) ?? "comment", null, "neutral", "C");
    case "dev.comtrya.repository.created":
      return activity("created repository", path ?? repository ?? "repository", path ? `/r/${path}` : null, "open", "R");
    case "dev.comtrya.repository.imported":
      return activity("imported repository", path ?? repository ?? "repository", path ? `/r/${path}` : null, "open", "R");
    case "dev.comtrya.instance.started":
      return activity("instance booted", "kernel", null, "neutral", "·");
    case "dev.comtrya.extension.loaded":
      return activity("loaded extension", stringField(payload, "id") ?? item.emitter, null, "neutral", "X");
    case "dev.comtrya.relation.created":
      return activity("linked", relationLabel(payload), null, "neutral", "→");
    case "dev.comtrya.relation.deleted":
      return activity("unlinked", relationLabel(payload), null, "neutral", "↛");
    default: {
      const summary = stringField(payload, "summary");
      return activity(
        humanize(item.eventType),
        summary || title || item.source || item.emitter,
        null,
        "neutral",
        "·",
      );
    }
  }
}

function activity(
  verb: string,
  subject: string,
  href: string | null,
  tone: FormattedActivity["tone"],
  iconLabel: string,
): FormattedActivity {
  return { verb, subject, href, tone, iconLabel };
}

function humanize(eventType: string): string {
  return eventType
    .replace(/^dev\.comtrya\./, "")
    .replace(/[._-]/g, " ");
}

function labelWithNumber(title: string, number: number | null, kind: string): string {
  const numLabel = typeof number === "number" ? `#${number}` : "";
  const titleLabel = title || kind;
  return numLabel ? `${numLabel} ${titleLabel}` : titleLabel;
}

function issueHref(id: string | null, _number: number | null): string | null {
  if (!id) return null;
  return `/x/issues/${id}`;
}

function pullHref(id: string | null): string | null {
  if (!id) return null;
  return `/x/pulls/${id}`;
}

function relationLabel(payload: Record<string, unknown>): string {
  const from = stringField(payload, "from") ?? "from";
  const to = stringField(payload, "to") ?? "to";
  const kind = stringField(payload, "kind");
  return kind ? `${shortRef(from)} ${kind} ${shortRef(to)}` : `${shortRef(from)} → ${shortRef(to)}`;
}

function shortRef(value: string): string {
  if (!value) return value;
  const tail = value.split("/").pop();
  return tail || value;
}

function stringField(payload: Record<string, unknown>, key: string): string | null {
  const value = payload[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function numberField(payload: Record<string, unknown>, key: string): number | null {
  const value = payload[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function relativeTime(ms: number): string {
  const diff = Math.max(0, Date.now() - ms);
  if (diff < 60_000) return "now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}
</script>

<template>
  <section class="activity-stream" data-smoke="activity-stream">
    <header>
      <div class="title">
        <h2>Today</h2>
        <span :class="['stream-status', `stream-status-${status}`]">
          <span class="dot" />
          {{ statusLabel }}
        </span>
      </div>
      <span class="count">{{ filtered.length }} event{{ filtered.length === 1 ? "" : "s" }}</span>
    </header>

    <p
      v-if="emptyState"
      class="muted"
      :class="{ error: emptyState.kind === 'error' }"
    >
      {{ emptyState.message }}
    </p>

    <ol v-else class="stream-list">
      <li
        v-for="({ item, fmt }, index) in formattedFiltered"
        :key="item.id"
        :class="[
          'stream-row',
          `tone-${fmt.tone}`,
          { focused: index === focusedIndex, fresh: item.isNew },
        ]"
        @mouseenter="focusedIndex = index"
      >
        <component
          :is="fmt.href ? RouterLink : 'div'"
          :to="fmt.href ?? undefined"
          class="stream-link"
        >
          <span class="icon" :aria-hidden="true">{{ fmt.iconLabel }}</span>
          <span class="row-body">
            <span class="verb">{{ fmt.verb }}</span>
            <span class="subject">{{ fmt.subject }}</span>
          </span>
          <span class="row-meta">
            <code>{{ item.emitter || "core" }}</code>
            <time>{{ relativeTime(item.timestampMs) }}</time>
          </span>
        </component>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.activity-stream {
  display: grid;
  gap: 12px;
  font-family: var(--font-sans);
  color: var(--fg);
}

.activity-stream header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 0.5px solid var(--line);
  padding-bottom: 6px;
}

.activity-stream .title {
  display: inline-flex;
  align-items: baseline;
  gap: 12px;
}

.activity-stream h2 {
  margin: 0;
  font-family: var(--font-sans);
  font-size: 22px;
  line-height: 1;
}

.stream-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 500;
  color: var(--fg-3);
  text-transform: none;
  letter-spacing: 0;
}

.stream-status .dot {
  width: 6px;
  height: 6px;
  background: var(--fg-3);
  border-radius: 50%;
}

.stream-status-live .dot {
  background: var(--ok);
  box-shadow: 0 0 0 0 var(--ok);
  animation: stream-pulse 2.4s ease-out infinite;
}

.stream-status-error .dot {
  background: var(--err);
}

@keyframes stream-pulse {
  0% {
    box-shadow: 0 0 0 0 oklch(75% 0.15 150 / 0.5);
  }
  100% {
    box-shadow: 0 0 0 7px oklch(75% 0.15 150 / 0);
  }
}

.activity-stream .count {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 500;
  color: var(--fg-3);
}

.muted {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 500;
  color: var(--fg-3);
}

.muted.error {
  color: var(--err);
}

.stream-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
}

.stream-row {
  border-bottom: 1px solid var(--line);
  transition: background 200ms ease;
}

.stream-row.focused {
  background: var(--bg-2);
}

.stream-row.fresh {
  background: color-mix(in srgb, var(--ok) 12%, var(--bg));
  animation: stream-flash 4s ease-out;
}

@keyframes stream-flash {
  0% {
    background: color-mix(in srgb, var(--ok) 24%, var(--bg));
  }
  100% {
    background: var(--bg);
  }
}

.stream-link {
  display: grid;
  grid-template-columns: 22px 1fr auto;
  gap: 12px;
  align-items: baseline;
  padding: 9px 0;
  color: inherit;
  text-decoration: none;
}

a.stream-link:hover {
  text-decoration: none;
  cursor: pointer;
}

.icon {
  font-family: var(--font-mono);
  font-size: 11px;
  text-align: center;
  color: var(--fg-3);
  font-weight: 600;
  letter-spacing: 0.02em;
}

.tone-open .icon {
  color: var(--ok);
}

.tone-merged .icon {
  color: var(--info);
}

.tone-closed .icon {
  color: var(--err);
}

.row-body {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0 8px;
  align-items: baseline;
  min-width: 0;
}

.verb {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--fg-3);
  text-transform: lowercase;
}

.subject {
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.row-meta {
  display: inline-flex;
  align-items: baseline;
  gap: 10px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--fg-3);
  white-space: nowrap;
}

.row-meta code {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--fg-4);
}
</style>
