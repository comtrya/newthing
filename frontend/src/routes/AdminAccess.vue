<script setup lang="ts">
import { computed } from "vue";
import AdminNav from "../components/AdminNav.vue";
import Icon from "../components/Icon.vue";
import Chip from "../components/Chip.vue";
import { formatUnixTime, useAdminTelemetry } from "../admin-telemetry";

const { telemetry, loading, error, refresh } = useAdminTelemetry();

const accessStats = computed(() => {
  const data = telemetry.value;
  if (!data) return [];
  return [
    { label: "active sessions", value: data.access.activeSessions },
    { label: "active credentials", value: data.access.activeCredentials },
    { label: "rate limit rows", value: data.access.rateLimitRows },
    { label: "oidc issuers", value: data.access.oidcIssuers.length },
  ];
});
</script>

<template>
  <div class="admin-screen">
    <AdminNav active="users" />
    <div class="admin-content no-scrollbar">
      <div class="page-header">
        <div>
          <div class="eyebrow" style="margin-bottom: 6px">Access telemetry</div>
          <h1 class="serif">Authentication and authorization</h1>
          <div class="subline">
            <template v-if="telemetry">
              Live metadata from the local session, credential, rate-limit, and OIDC stores.
            </template>
            <template v-else-if="loading">Loading access telemetry...</template>
            <template v-else>Access telemetry unavailable</template>
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
        <div class="stat-grid">
          <div v-for="stat in accessStats" :key="stat.label" class="glass stat-card">
            <div class="eyebrow">{{ stat.label }}</div>
            <div class="mono stat-value">{{ stat.value }}</div>
          </div>
        </div>

        <div class="glass" style="margin-bottom: 16px">
          <div class="section-hd">
            <div class="section-hd-title">OIDC issuers</div>
            <div class="section-hd-sub">
              {{ telemetry.access.oidcIssuers.length }} configured
            </div>
          </div>
          <div v-if="telemetry.access.oidcIssuers.length" class="rows">
            <div v-for="issuer in telemetry.access.oidcIssuers" :key="issuer.id" class="issuer-row">
              <span class="issuer-icon"><Icon name="lock" /></span>
              <div class="issuer-main">
                <div class="issuer-title">
                  <span class="mono">{{ issuer.id }}</span>
                  <Chip mono>{{ issuer.clientKind }}</Chip>
                  <Chip v-if="issuer.hasClientSecret" mono tone="ok">secret configured</Chip>
                  <Chip v-else mono tone="warn">no client secret</Chip>
                </div>
                <div class="issuer-detail mono">{{ issuer.issuerURL }}</div>
                <div class="issuer-detail mono">{{ issuer.redirectURL }}</div>
              </div>
              <div class="issuer-policy">
                <div>
                  <span>domains</span>
                  <strong>{{ issuer.allowedDomains.length || 0 }}</strong>
                </div>
                <div>
                  <span>groups</span>
                  <strong>{{ issuer.allowedGroups.length || 0 }}</strong>
                </div>
                <div>
                  <span>subjects</span>
                  <strong>{{ issuer.allowedSubjects.length || 0 }}</strong>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty">No OIDC issuers are configured for this instance.</div>
        </div>

        <div class="grid two">
          <div class="glass">
            <div class="section-hd">
              <div class="section-hd-title">Credential store</div>
              <div class="section-hd-sub">SQLite-backed runtime counts</div>
            </div>
            <div class="kv-list">
              <div>
                <span>active credentials</span>
                <strong class="mono">{{ telemetry.access.activeCredentials }}</strong>
              </div>
              <div>
                <span>active sessions</span>
                <strong class="mono">{{ telemetry.access.activeSessions }}</strong>
              </div>
              <div>
                <span>rate limit rows</span>
                <strong class="mono">{{ telemetry.access.rateLimitRows }}</strong>
              </div>
              <div>
                <span>sampled at</span>
                <strong class="mono">{{ formatUnixTime(telemetry.instance.now) }}</strong>
              </div>
            </div>
          </div>

          <div class="glass">
            <div class="section-hd">
              <div class="section-hd-title">Unsupported admin surfaces</div>
              <div class="section-hd-sub">
                {{ telemetry.readiness.unsupported.length }} explicit gaps
              </div>
            </div>
            <div v-if="telemetry.readiness.unsupported.length" class="rows">
              <div
                v-for="surface in telemetry.readiness.unsupported"
                :key="surface.id"
                class="unsupported-row"
              >
                <Chip mono tone="warn">{{ surface.id }}</Chip>
                <div>
                  <div class="mono path">{{ surface.pathPrefix }}</div>
                  <div class="detail">{{ surface.message }}</div>
                </div>
              </div>
            </div>
            <div v-else class="empty">No unsupported access surfaces were reported.</div>
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
.page-header h1 {
  font-size: 32px;
  margin: 0;
  font-weight: 400;
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
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}
.stat-card {
  padding: 16px;
}
.stat-value {
  font-size: 28px;
  color: var(--fg);
  margin-top: 8px;
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
.issuer-row {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  border-radius: 8px;
}
.issuer-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--surface-2);
  color: var(--accent);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.issuer-main {
  flex: 1;
  min-width: 0;
}
.issuer-title {
  display: flex;
  gap: 6px;
  align-items: center;
  color: var(--fg);
  font-size: 13px;
}
.issuer-detail {
  margin-top: 4px;
  font-size: 10.5px;
  color: var(--fg-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.issuer-policy {
  display: flex;
  gap: 16px;
}
.issuer-policy div {
  display: grid;
  gap: 2px;
  text-align: right;
}
.issuer-policy span {
  font-size: 10px;
  color: var(--fg-4);
}
.issuer-policy strong {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--fg);
}
.grid {
  display: grid;
  gap: 16px;
}
.grid.two {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}
.kv-list {
  display: grid;
  gap: 1px;
  padding: 10px;
}
.kv-list > div {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr);
  gap: 12px;
  padding: 8px 10px;
  border-radius: 6px;
}
.kv-list span,
.detail {
  font-size: 11px;
  color: var(--fg-3);
}
.kv-list strong,
.path {
  font-size: 11px;
  color: var(--fg-2);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.unsupported-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  padding: 10px 12px;
  align-items: start;
}
.empty {
  padding: 18px;
  font-size: 12px;
  color: var(--fg-3);
}
</style>
