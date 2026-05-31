import { computed, onMounted, ref } from "vue";
import { getGraphQLClient } from "@comtrya/sdk-core";

export interface TelemetryPath {
  path: string;
  exists: boolean;
  isDirectory?: boolean;
  bytes: number;
  files?: number;
}

export interface AdminTelemetryService {
  name: string;
  status: "ok" | "degraded" | "error" | string;
  detail: string;
}

export interface ConfigSync {
  configured: boolean;
  repoUrl: string | null;
  lastCommit: string | null;
  lastSyncedUnix: number | null;
  lastError: string | null;
  intervalSeconds: number;
  pendingExtensionReload: boolean;
}

export interface AdminTelemetry {
  configSync: ConfigSync | null;
  instance: {
    id: string;
    name: string;
    mode: string;
    version: string;
    publicURL: string;
    uptimeSeconds: number;
    startedAt: number;
    now: number;
    processID: number;
  };
  services: AdminTelemetryService[];
  readiness: {
    ready: boolean;
    mode: string;
    checks: Record<string, boolean>;
    unsupported: Array<{ id: string; pathPrefix: string; message: string }>;
  };
  access: {
    activeSessions: number;
    activeCredentials: number;
    rateLimitRows: number;
    oidcIssuers: Array<{
      id: string;
      issuerURL: string;
      clientID: string;
      clientKind: string;
      redirectURL: string;
      allowedDomains: string[];
      allowedGroups: string[];
      allowedSubjects: string[];
      hasClientSecret: boolean;
    }>;
  };
  storage: {
    dataDir: TelemetryPath;
    metadata: TelemetryPath;
    repositories: {
      count: number;
      root: TelemetryPath;
      backends: Array<{
        name: string;
        kind: string;
        configuredPath: string | null;
      }>;
    };
    extensionStorage: TelemetryPath;
    events: TelemetryPath;
    audit: TelemetryPath;
  };
  extensions: Array<{
    id: string;
    status: string;
    component: string;
    outputType: string;
    routePrefix: string;
    relationshipTypes: unknown[];
  }>;
  recentEvents: Array<{
    id?: string;
    type?: string;
    time?: number;
    source?: string;
    data?: Record<string, unknown>;
  }>;
}

interface AdminTelemetryPayload {
  adminTelemetry?: unknown;
}

/** Session record returned by GET /api/admin/sessions — bearer token excluded */
export interface AdminSession {
  sessionId: string;
  principal: string;
  expiresAt: number;
  createdAt: number;
}

/**
 * Runtime type guard for the admin telemetry JSON-scalar payload.
 *
 * `adminTelemetry` is returned as a raw JSON scalar (no GraphQL subfields
 * are declared on the server side). The TypeScript interface `AdminTelemetry`
 * cannot be verified at compile time — this guard validates the minimum
 * required shape at the edge so downstream code can safely dereference deep
 * paths like `telemetry.readiness.ready` without risking `TypeError` on a
 * partial or malformed payload (closes #118).
 *
 * Validates:
 *   - Top-level object with the required section keys
 *   - `instance` has at minimum `id` (string) and `now` (number)
 *   - `readiness` has at minimum `ready` (boolean)
 *   - `access`, `storage`, `services`, `extensions`, `recentEvents` exist
 */
function isAdminTelemetry(value: unknown): value is AdminTelemetry {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  // Require the top-level sections
  for (const key of [
    "instance",
    "services",
    "readiness",
    "access",
    "storage",
    "extensions",
    "recentEvents",
  ]) {
    if (!(key in v)) return false;
  }
  // Spot-check instance shape
  const inst = v["instance"];
  if (!inst || typeof inst !== "object") return false;
  const i = inst as Record<string, unknown>;
  if (typeof i["id"] !== "string") return false;
  if (typeof i["now"] !== "number") return false;
  // Spot-check readiness shape
  const rdy = v["readiness"];
  if (!rdy || typeof rdy !== "object") return false;
  if (typeof (rdy as Record<string, unknown>)["ready"] !== "boolean") return false;
  return true;
}

export function useAdminTelemetry() {
  const telemetry = ref<AdminTelemetry | null>(null);
  const loading = ref(true);
  const error = ref<string | null>(null);

  async function refresh(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const payload = await getGraphQLClient().query<AdminTelemetryPayload>(
        `query AdminTelemetry { adminTelemetry }`,
      );
      const raw = payload.adminTelemetry;
      if (!isAdminTelemetry(raw)) {
        telemetry.value = null;
        error.value =
          raw == null
            ? "admin telemetry was not returned"
            : "admin telemetry payload has an unexpected shape";
        return;
      }
      telemetry.value = raw;
    } catch (caught) {
      telemetry.value = null;
      error.value = caught instanceof Error ? caught.message : String(caught);
    } finally {
      loading.value = false;
    }
  }

  async function syncNow(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      await getGraphQLClient().mutate(`mutation SyncConfig { syncConfig }`);
      await refresh();
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : String(caught);
      loading.value = false;
    }
  }

  /**
   * Flush the OIDC discovery cache for a single issuer. The next login
   * attempt via that issuer will trigger a fresh HTTP discovery round-trip.
   * Calls the REST admin endpoint rather than GraphQL (write → RPC path).
   */
  async function refreshOidcIssuer(issuerId: string): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(`/api/admin/oidc-issuers/${encodeURIComponent(issuerId)}/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error((body as { message?: string }).message ?? res.statusText);
      }
      await refresh();
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : String(caught);
      loading.value = false;
    }
  }

  /** Fetch the current list of active sessions from the admin API. */
  async function listSessions(): Promise<AdminSession[]> {
    const res = await fetch("/api/admin/sessions", {
      credentials: "include",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error((body as { message?: string }).message ?? res.statusText);
    }
    const data = await res.json();
    return (data.sessions ?? []) as AdminSession[];
  }

  /** Revoke a single session by its opaque session_id. */
  async function revokeSession(sessionId: string): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(`/api/admin/sessions/${encodeURIComponent(sessionId)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error((body as { message?: string }).message ?? res.statusText);
      }
      await refresh();
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : String(caught);
      loading.value = false;
    }
  }

  onMounted(() => {
    void refresh();
  });

  return {
    telemetry,
    loading,
    error,
    refresh,
    syncNow,
    refreshOidcIssuer,
    listSessions,
    revokeSession,
    ready: computed(() => telemetry.value?.readiness.ready ?? false),
    configSync: computed(() => telemetry.value?.configSync ?? null),
  };
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const precision = value >= 10 || unit === 0 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[unit]}`;
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0s";
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${Math.floor(seconds)}s`;
}

export function formatUnixTime(seconds?: number): string {
  if (!seconds) return "unknown";
  return new Date(seconds * 1000).toLocaleString();
}

export function eventTitle(event: AdminTelemetry["recentEvents"][number]): string {
  return event.type ?? event.id ?? "runtime event";
}

export function eventDetail(event: AdminTelemetry["recentEvents"][number]): string {
  const data = event.data ?? {};
  const resource = data.resource ?? data.repository ?? data.scope ?? data.principal;
  if (typeof resource === "string") return resource;
  return event.source ?? "comtrya://instance/local";
}
