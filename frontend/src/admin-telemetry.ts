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

export interface AdminTelemetry {
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
  adminTelemetry?: AdminTelemetry;
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
      telemetry.value = payload.adminTelemetry ?? null;
      if (!telemetry.value) {
        error.value = "admin telemetry was not returned";
      }
    } catch (caught) {
      telemetry.value = null;
      error.value = caught instanceof Error ? caught.message : String(caught);
    } finally {
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
    ready: computed(() => telemetry.value?.readiness.ready ?? false),
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
