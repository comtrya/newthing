<script setup lang="ts">
import { computed } from "vue";
import AdminNav from "../components/AdminNav.vue";
import Icon from "../components/Icon.vue";
import Chip from "../components/Chip.vue";
import {
  formatBytes,
  useAdminTelemetry,
  type TelemetryPath,
} from "../admin-telemetry";

const { telemetry, loading, error, refresh } = useAdminTelemetry();

const directoryRows = computed(() => {
  const data = telemetry.value;
  if (!data) return [];
  return [
    { label: "Data directory", value: data.storage.dataDir },
    { label: "Metadata", value: data.storage.metadata },
    { label: "Repositories", value: data.storage.repositories.root },
    { label: "Extension storage", value: data.storage.extensionStorage },
  ];
});

const logRows = computed(() => {
  const data = telemetry.value;
  if (!data) return [];
  return [
    { label: "Events log", value: data.storage.events },
    { label: "Audit log", value: data.storage.audit },
  ];
});

function statusTone(path: TelemetryPath): "ok" | "err" {
  return path.exists ? "ok" : "err";
}

function statusLabel(path: TelemetryPath): string {
  return path.exists ? "Present" : "Missing";
}
</script>

<template>
  <div class="admin-screen">
    <AdminNav active="storage" />
    <div class="admin-content no-scrollbar">
      <div class="page-header">
        <div>
          <div class="eyebrow" style="margin-bottom: 6px">Storage telemetry</div>
          <h1>Runtime storage paths</h1>
          <div class="subline">
            <template v-if="telemetry">
              Live filesystem counts from the configured data directory.
            </template>
            <template v-else-if="loading">Loading storage telemetry...</template>
            <template v-else>Storage telemetry unavailable</template>
          </div>
        </div>
        <div class="spacer" />
        <button class="btn" type="button" :disabled="loading" @click="refresh">
          <Icon name="retry" /><span>{{ loading ? "Refreshing" : "Refresh" }}</span>
        </button>
      </div>

      <div v-if="error" class="glass error-panel">
        <Icon name="x" />
        <span>{{ error }}</span>
      </div>

      <template v-if="telemetry">
        <div class="summary-grid">
          <div class="glass summary-card">
            <div class="eyebrow">Repositories</div>
            <div class="summary-value">{{ telemetry.storage.repositories.count }}</div>
            <div class="summary-detail">
              {{ telemetry.storage.repositories.root.files ?? 0 }} files ·
              {{ formatBytes(telemetry.storage.repositories.root.bytes) }}
            </div>
          </div>
          <div class="glass summary-card">
            <div class="eyebrow">Extension storage</div>
            <div class="summary-value">
              {{ formatBytes(telemetry.storage.extensionStorage.bytes) }}
            </div>
            <div class="summary-detail">
              {{ telemetry.storage.extensionStorage.files ?? 0 }} files
            </div>
          </div>
          <div class="glass summary-card">
            <div class="eyebrow">Metadata</div>
            <div class="summary-value">{{ formatBytes(telemetry.storage.metadata.bytes) }}</div>
            <div class="summary-detail">{{ telemetry.storage.metadata.files ?? 0 }} files</div>
          </div>
        </div>

        <div class="glass" style="margin-bottom: 16px">
          <div class="section-hd">
            <div class="section-hd-title">Directories</div>
            <div class="section-hd-sub">{{ directoryRows.length }} tracked paths</div>
          </div>
          <div class="path-grid">
            <div v-for="row in directoryRows" :key="row.label" class="path-card">
              <div class="path-card-head">
                <span>{{ row.label }}</span>
                <Chip :tone="statusTone(row.value)">
                  {{ statusLabel(row.value) }}
                </Chip>
              </div>
              <div class="path mono">{{ row.value.path }}</div>
              <div class="path-meta">
                <span>{{ row.value.files ?? 0 }} files</span>
                <span>{{ formatBytes(row.value.bytes) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="grid two">
          <div class="glass">
            <div class="section-hd">
              <div class="section-hd-title">Repository backends</div>
              <div class="section-hd-sub">
                {{ telemetry.storage.repositories.backends.length }} configured
              </div>
            </div>
            <div v-if="telemetry.storage.repositories.backends.length" class="rows">
              <div
                v-for="backend in telemetry.storage.repositories.backends"
                :key="backend.name"
                class="backend-row"
              >
                <span class="backend-icon"><Icon name="ds" /></span>
                <div class="backend-main">
                  <div class="backend-title">
                    <span class="mono">{{ backend.name }}</span>
                    <Chip mono>{{ backend.kind }}</Chip>
                  </div>
                  <div class="backend-detail mono">
                    {{ backend.configuredPath || telemetry.storage.repositories.root.path }}
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty">No repository storage backends were reported.</div>
          </div>

          <div class="glass">
            <div class="section-hd">
              <div class="section-hd-title">Runtime logs</div>
              <div class="section-hd-sub">append-only metadata files</div>
            </div>
            <div class="rows">
              <div v-for="row in logRows" :key="row.label" class="log-row">
                <span :class="['log-icon', row.value.exists ? 'ok' : 'err']">
                  <Icon :name="row.value.exists ? 'check' : 'x'" />
                </span>
                <div class="log-main">
                  <div class="log-title">{{ row.label }}</div>
                  <div class="mono log-path">{{ row.value.path }}</div>
                </div>
                <div class="log-size">{{ formatBytes(row.value.bytes) }}</div>
              </div>
            </div>
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
.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}
.summary-card {
  padding: 16px;
}
.summary-value {
  font-family: var(--font-sans);
  font-size: 26px;
  font-weight: 600;
  color: var(--fg);
  margin-top: 8px;
}
.summary-detail {
  font-size: 11px;
  color: var(--fg-3);
  margin-top: 4px;
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
.path-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding: 12px;
}
.path-card {
  padding: 12px;
  border-radius: 8px;
  background: var(--surface);
  border: 0.5px solid var(--line);
}
.path-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  color: var(--fg);
}
.path-card-head :deep(.chip) {
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 600;
}
.path {
  margin-top: 8px;
  color: var(--fg-3);
  font-size: 10.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.path-meta {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  color: var(--fg-2);
  font-size: 11px;
}
.grid {
  display: grid;
  gap: 16px;
}
.grid.two {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}
.rows {
  padding: 6px;
}
.backend-row,
.log-row {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
}
.backend-icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: var(--surface-2);
  color: var(--accent);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.backend-main,
.log-main {
  flex: 1;
  min-width: 0;
}
.backend-title {
  display: flex;
  gap: 6px;
  align-items: center;
  color: var(--fg);
  font-size: 12px;
}
.backend-detail,
.log-path {
  margin-top: 4px;
  color: var(--fg-3);
  font-size: 10.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.log-icon {
  display: inline-flex;
  color: var(--fg-3);
}
.log-icon.ok {
  color: var(--ok);
}
.log-icon.err {
  color: var(--err);
}
.log-title {
  color: var(--fg);
  font-size: 12px;
}
.log-size {
  color: var(--fg-2);
  font-size: 11px;
}
.empty {
  padding: 18px;
  font-size: 12px;
  color: var(--fg-3);
}
</style>
