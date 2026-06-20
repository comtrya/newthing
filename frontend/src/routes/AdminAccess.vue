<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import AdminNav from "../components/AdminNav.vue";
import Icon from "../components/Icon.vue";
import Chip from "../components/Chip.vue";
import { formatUnixTime, useAdminTelemetry, type AdminSession } from "../admin-telemetry";

const {
  telemetry,
  loading,
  error,
  refresh,
  syncNow,
  refreshOidcIssuer,
  listSessions,
  revokeSession,
  configSync,
} = useAdminTelemetry();

const sessions = ref<AdminSession[]>([]);
const sessionsError = ref<string | null>(null);
const sessionsLoading = ref(false);

async function loadSessions(): Promise<void> {
  sessionsLoading.value = true;
  sessionsError.value = null;
  try {
    sessions.value = await listSessions();
  } catch (caught) {
    sessionsError.value = caught instanceof Error ? caught.message : String(caught);
  } finally {
    sessionsLoading.value = false;
  }
}

async function handleRevokeSession(sessionId: string): Promise<void> {
  await revokeSession(sessionId);
  await loadSessions();
}

function formatActiveSessionCount(count: number): string {
  return `${count} active session${count === 1 ? "" : "s"}`;
}

function formatOidcIssuerCount(count: number): string {
  return `${count} configured issuer${count === 1 ? "" : "s"}`;
}

function formatUnsupportedSurfaceCount(count: number): string {
  return `${count} unsupported surface${count === 1 ? "" : "s"}`;
}

onMounted(() => void loadSessions());

const accessStats = computed(() => {
  const data = telemetry.value;
  if (!data) return [];
  return [
    { label: "Active sessions", value: data.access.activeSessions },
    { label: "Active credentials", value: data.access.activeCredentials },
    { label: "Rate limit rows", value: data.access.rateLimitRows },
    { label: "OIDC issuers", value: data.access.oidcIssuers.length },
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
          <h1>Authentication and authorization</h1>
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
            <div class="stat-value">{{ stat.value }}</div>
          </div>
        </div>

        <div class="glass" style="margin-bottom: 16px">
          <div class="section-hd">
            <div class="section-hd-title">Configuration sync</div>
            <div class="section-hd-sub">GitOps configuration repository</div>
            <div class="spacer" />
            <button
              class="btn"
              type="button"
              :disabled="loading || !configSync?.configured"
              @click="syncNow"
            >
              <Icon name="retry" /><span>{{ loading ? "Syncing" : "Sync now" }}</span>
            </button>
          </div>
          <div v-if="configSync?.configured" class="kv-list">
            <div>
              <span>Repository</span>
              <strong class="mono">{{ configSync.repoUrl }}</strong>
            </div>
            <div>
              <span>Last commit</span>
              <strong class="mono">{{
                configSync.lastCommit ? configSync.lastCommit.slice(0, 12) : "unknown"
              }}</strong>
            </div>
            <div>
              <span>Last synced</span>
              <strong class="mono">{{
                formatUnixTime(configSync.lastSyncedUnix ?? undefined)
              }}</strong>
            </div>
            <div>
              <span>Interval</span>
              <strong class="mono">{{ configSync.intervalSeconds }}s</strong>
            </div>
            <div v-if="configSync.pendingExtensionReload">
              <span>Extensions</span>
              <Chip tone="warn">Restart required</Chip>
            </div>
            <div v-if="configSync.lastError">
              <span>Last error</span>
              <strong class="mono" style="color: var(--err)">{{ configSync.lastError }}</strong>
            </div>
          </div>
          <div v-else class="empty">
            This instance is not configured with a configuration repository
            (COMTRYA_CONFIG_REPO_URL is unset).
          </div>
        </div>

        <div class="glass" style="margin-bottom: 16px">
          <div class="section-hd">
            <div class="section-hd-title">OIDC issuers</div>
            <div class="section-hd-sub">
              {{ formatOidcIssuerCount(telemetry.access.oidcIssuers.length) }}
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
              <div class="issuer-actions">
                <button
                  class="btn btn-sm"
                  type="button"
                  :disabled="loading"
                  :title="`Flush OIDC discovery cache for ${issuer.id}. Forces a fresh HTTP discovery on the next login.`"
                  @click="refreshOidcIssuer(issuer.id)"
                >
                  <Icon name="retry" /><span>Refresh discovery</span>
                </button>
              </div>
            </div>
          </div>
          <div v-else class="empty">No OIDC issuers are configured for this instance.</div>
        </div>

        <!-- Active sessions with per-session revoke -->
        <div class="glass" style="margin-bottom: 16px">
          <div class="section-hd">
            <div class="section-hd-title">Active sessions</div>
            <div class="section-hd-sub">
              {{ formatActiveSessionCount(sessions.length) }}{{ sessionsLoading ? " (loading…)" : "" }}
            </div>
            <div class="spacer" />
            <button class="btn" type="button" :disabled="sessionsLoading" @click="loadSessions">
              <Icon name="retry" /><span>Refresh</span>
            </button>
          </div>
          <div v-if="sessionsError" class="error-panel">{{ sessionsError }}</div>
          <div v-else-if="sessions.length" class="rows">
            <div
              v-for="session in sessions"
              :key="session.sessionId"
              class="session-row"
            >
              <div class="session-main">
                <div class="session-title">
                  <Chip mono>{{ session.principal }}</Chip>
                  <span class="mono session-id">{{ session.sessionId }}</span>
                </div>
                <div class="session-detail">
                  Created {{ formatUnixTime(session.createdAt) }} · Expires
                  {{ formatUnixTime(session.expiresAt) }}
                </div>
              </div>
              <button
                class="btn btn-sm"
                type="button"
                :disabled="loading"
                title="Revoke this session immediately"
                @click="handleRevokeSession(session.sessionId)"
              >
                <Icon name="x" /><span>Revoke</span>
              </button>
            </div>
          </div>
          <div v-else class="empty">No active sessions.</div>
        </div>

        <div class="grid two">
          <div class="glass">
            <div class="section-hd">
              <div class="section-hd-title">Credential store</div>
              <div class="section-hd-sub">SQLite-backed runtime counts</div>
            </div>
            <div class="kv-list">
              <div>
                <span>Active credentials</span>
                <strong>{{ telemetry.access.activeCredentials }}</strong>
              </div>
              <div>
                <span>Active sessions</span>
                <strong>{{ telemetry.access.activeSessions }}</strong>
              </div>
              <div>
                <span>Rate limit rows</span>
                <strong>{{ telemetry.access.rateLimitRows }}</strong>
              </div>
              <div>
                <span>Sampled at</span>
                <strong>{{ formatUnixTime(telemetry.instance.now) }}</strong>
              </div>
            </div>
          </div>

          <div class="glass">
            <div class="section-hd">
              <div class="section-hd-title">Unsupported admin surfaces</div>
              <div class="section-hd-sub">
                {{ formatUnsupportedSurfaceCount(telemetry.readiness.unsupported.length) }}
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
  font-family: var(--font-sans);
  font-size: 28px;
  font-weight: 600;
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
.session-detail {
  margin-top: 4px;
  font-family: var(--font-sans);
  font-size: 11px;
  letter-spacing: 0;
  color: var(--fg-3);
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
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0;
  color: var(--fg-3);
}
.kv-list strong,
.path {
  font-size: 11px;
  letter-spacing: 0;
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
