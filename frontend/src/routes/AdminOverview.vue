<script setup lang="ts">
import { computed } from "vue";
import AdminNav from "../components/AdminNav.vue";
import Icon from "../components/Icon.vue";
import Chip from "../components/Chip.vue";
import {
  eventDetail,
  eventTitle,
  formatBytes,
  formatDuration,
  formatUnixTime,
  useAdminTelemetry,
  type AdminTelemetryService,
} from "../admin-telemetry";

const { telemetry, loading, error, refresh } = useAdminTelemetry();

const healthyServices = computed(
  () => telemetry.value?.services.filter((service) => service.status === "ok").length ?? 0,
);

const readinessChecks = computed(() =>
  Object.entries(telemetry.value?.readiness.checks ?? {}).map(([name, ok]) => ({
    name,
    label: readinessCheckLabel(name),
    ok,
    status: ok ? "Passing" : "Failing",
  })),
);

const serviceRows = computed(() =>
  (telemetry.value?.services ?? []).map((service) => ({
    ...service,
    label: serviceLabel(service.name),
    statusLabel: serviceStatusLabel(service.status),
  })),
);

const serviceLabels: Record<string, string> = {
  "event-stream": "Event stream",
  "extension-runtime": "Extension runtime",
  "git-http": "Git smart HTTP",
  graphql: "GraphQL",
  persistence: "Persistence",
  server: "Server",
};

const readinessLabels: Record<string, string> = {
  auditLogWritable: "Audit log",
  configValid: "Configuration",
  dataDirWritable: "Data directory",
  eventLogWritable: "Event log",
  extensionStorageDocuments: "Extension storage documents",
  extensionStorageSchema: "Extension storage schema",
  operatorCodeConfigured: "Operator code",
  productionTlsTerminated: "TLS termination",
  repositoryRoot: "Repository root",
};

function serviceLabel(name: string): string {
  return serviceLabels[name] ?? titleCaseWords(name);
}

function serviceStatusLabel(status: string): string {
  if (status === "ok") return "Operational";
  if (status === "error") return "Failed";
  return titleCaseWords(status);
}

function readinessCheckLabel(name: string): string {
  return readinessLabels[name] ?? titleCaseWords(name.replace(/([a-z0-9])([A-Z])/g, "$1 $2"));
}

function titleCaseWords(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

const overviewStats = computed(() => {
  const data = telemetry.value;
  if (!data) return [];
  return [
    { label: "Repositories", value: String(data.storage.repositories.count) },
    { label: "Extensions", value: String(data.extensions.length) },
    { label: "Sessions", value: String(data.access.activeSessions) },
    { label: "Event log", value: formatBytes(data.storage.events.bytes) },
  ];
});

function readinessStatusLabel(ready: boolean): string {
  return ready ? "Ready" : "Degraded";
}

function serviceTone(service: AdminTelemetryService): "ok" | "warn" | "err" {
  if (service.status === "ok") return "ok";
  if (service.status === "error") return "err";
  return "warn";
}
</script>

<template>
  <div class="admin-screen">
    <AdminNav active="overview" />
    <div class="admin-content no-scrollbar">
      <div class="page-header">
        <div>
          <div class="eyebrow" style="margin-bottom: 6px">
            {{ telemetry?.instance.publicURL || "Local instance" }}
          </div>
          <h1>Instance overview</h1>
          <div class="subline">
            <template v-if="telemetry">
              {{ telemetry.instance.name }} · {{ titleCaseWords(telemetry.instance.mode) }} ·
              <span class="mono">{{ telemetry.instance.version }}</span>
            </template>
            <template v-else-if="loading">Loading instance status...</template>
            <template v-else>Instance status unavailable</template>
          </div>
        </div>
        <div class="spacer" />
        <button class="btn" type="button" :disabled="loading" @click="refresh">
          <Icon name="retry" /><span>{{ loading ? "Refreshing" : "Refresh" }}</span>
        </button>
      </div>

      <div v-if="error" class="glass error-panel">
        <Icon name="x" />
        <span>The instance status could not be loaded. Try refreshing the page.</span>
      </div>

      <template v-if="telemetry">
        <div class="glass machine-card">
          <div>
            <div class="eyebrow" style="margin-bottom: 6px">Runtime</div>
            <div class="mono runtime-id">{{ telemetry.instance.id }}</div>
            <div class="runtime-meta">
              pid {{ telemetry.instance.processID }} · started
              {{ formatUnixTime(telemetry.instance.startedAt) }}
            </div>
            <div class="chips">
              <Chip :tone="telemetry.readiness.ready ? 'ok' : 'warn'" dot>
                {{ readinessStatusLabel(telemetry.readiness.ready) }}
              </Chip>
              <Chip>{{ formatDuration(telemetry.instance.uptimeSeconds) }} uptime</Chip>
            </div>
          </div>

          <div v-for="stat in overviewStats" :key="stat.label" class="stat-card">
            <div class="eyebrow">{{ stat.label }}</div>
            <div class="stat-value">{{ stat.value }}</div>
          </div>
        </div>

        <div class="grid two">
          <div class="glass">
            <div class="section-hd">
              <div class="section-hd-title">Services</div>
              <div class="section-hd-sub">
                {{ healthyServices }} / {{ telemetry.services.length }} healthy
              </div>
            </div>
            <div class="rows services">
              <div v-for="service in serviceRows" :key="service.name" class="row">
                <span class="row-icon" :class="service.status === 'ok' ? 'ok' : 'warn'">
                  <Icon :name="service.status === 'ok' ? 'check' : 'clock'" />
                </span>
                <div class="row-main">
                  <div class="row-title">{{ service.label }}</div>
                  <div class="row-detail">{{ service.detail }}</div>
                </div>
                <Chip :tone="serviceTone(service)">{{ service.statusLabel }}</Chip>
              </div>
            </div>
          </div>

          <div class="glass">
            <div class="section-hd">
              <div class="section-hd-title">Readiness checks</div>
              <div class="section-hd-sub">{{ readinessChecks.length }} checks</div>
            </div>
            <div class="rows compact">
              <div v-for="check in readinessChecks" :key="check.name" class="row">
                <span class="row-icon" :class="check.ok ? 'ok' : 'warn'">
                  <Icon :name="check.ok ? 'check' : 'x'" />
                </span>
                <div class="row-main">
                  <div class="row-title">{{ check.label }}</div>
                </div>
                <Chip :tone="check.ok ? 'ok' : 'err'">
                  {{ check.status }}
                </Chip>
              </div>
            </div>
          </div>
        </div>

        <div class="grid two lower">
          <div class="glass">
            <div class="section-hd">
              <div class="section-hd-title">Storage summary</div>
              <div class="section-hd-sub">
                {{ telemetry.storage.repositories.count }} repositories
              </div>
            </div>
            <div class="kv-list">
              <div>
                <span>data dir</span>
                <strong class="mono">{{ telemetry.storage.dataDir.path }}</strong>
              </div>
              <div>
                <span>repository root</span>
                <strong class="mono">{{ telemetry.storage.repositories.root.path }}</strong>
              </div>
              <div>
                <span>extension storage</span>
                <strong class="mono">{{ telemetry.storage.extensionStorage.path }}</strong>
              </div>
              <div>
                <span>metadata size</span>
                <strong class="mono">{{ formatBytes(telemetry.storage.metadata.bytes) }}</strong>
              </div>
            </div>
          </div>

          <div class="glass">
            <div class="section-hd">
              <div class="section-hd-title">Recent runtime events</div>
              <div class="section-hd-sub">{{ telemetry.recentEvents.length }} loaded</div>
            </div>
            <div v-if="telemetry.recentEvents.length" class="rows">
              <div v-for="event in telemetry.recentEvents" :key="event.id ?? event.type" class="row">
                <span class="row-icon"><Icon name="spark" /></span>
                <div class="row-main">
                  <div class="row-title">{{ eventTitle(event) }}</div>
                  <div class="row-detail mono">{{ eventDetail(event) }}</div>
                </div>
                <span class="mono time">{{ formatUnixTime(event.time) }}</span>
              </div>
            </div>
            <div v-else class="empty">No runtime events have been recorded yet.</div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.admin-screen {
  display: flex;
  height: 100%;
  overflow: hidden;
}
.admin-content {
  flex: 1;
  padding: 22px 28px;
  overflow-y: auto;
}
.page-header {
  display: flex;
  align-items: flex-end;
  margin-bottom: 22px;
}
.eyebrow {
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
}
.page-header h1 {
  font-family: var(--font-sans);
  font-size: 32px;
  margin: 0;
  font-weight: 600;
  letter-spacing: 0;
}
.subline {
  margin-top: 8px;
  font-size: 13px;
  color: var(--fg-2);
}
.spacer {
  flex: 1;
}
.error-panel {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 14px;
  color: var(--err);
}
.machine-card {
  display: grid;
  grid-template-columns: 1.4fr repeat(4, minmax(120px, 1fr));
  gap: 16px;
  padding: 18px 22px;
  margin-bottom: 18px;
  background: linear-gradient(135deg, var(--accent-soft), transparent 64%);
}
.runtime-id {
  font-size: 16px;
  color: var(--fg);
}
.runtime-meta {
  font-size: 11px;
  color: var(--fg-3);
  margin-top: 4px;
}
.chips {
  display: flex;
  gap: 6px;
  margin-top: 10px;
  flex-wrap: wrap;
}
.chips :deep(.chip) {
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 600;
}
.stat-card {
  min-width: 0;
}
.stat-value {
  font-size: 24px;
  margin-top: 8px;
  color: var(--fg);
  font-weight: 600;
  letter-spacing: 0;
}
.grid {
  display: grid;
  gap: 16px;
}
.grid.two {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}
.lower {
  margin-top: 16px;
}
.section-hd {
  display: flex;
  align-items: baseline;
  padding: 12px 16px;
  border-bottom: 0.5px solid var(--line);
}
.section-hd-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--fg);
}
.section-hd-sub {
  font-size: 11px;
  color: var(--fg-3);
  margin-left: 8px;
}
.rows {
  padding: 6px;
}
.rows.compact {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}
.rows.services :deep(.chip),
.rows.compact :deep(.chip) {
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 600;
}
.row {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
}
.row-icon {
  display: inline-flex;
  color: var(--fg-3);
}
.row-icon.ok {
  color: var(--ok);
}
.row-icon.warn {
  color: var(--warn);
}
.row-main {
  flex: 1;
  min-width: 0;
}
.row-title {
  font-size: 12px;
  color: var(--fg);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.row-detail {
  font-size: 10.5px;
  color: var(--fg-3);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.time {
  font-size: 10.5px;
  color: var(--fg-4);
  width: 120px;
  text-align: right;
}
.kv-list {
  display: grid;
  gap: 1px;
  padding: 10px;
}
.kv-list > div {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  gap: 12px;
  padding: 8px 10px;
  border-radius: 6px;
}
.kv-list span {
  font-size: 11px;
  color: var(--fg-3);
}
.kv-list strong {
  font-size: 11px;
  color: var(--fg-2);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.empty {
  padding: 18px;
  font-size: 12px;
  color: var(--fg-3);
}
</style>
