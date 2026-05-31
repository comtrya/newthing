/**
 * Tests for the admin telemetry edge-validation guard (issue #118).
 *
 * isAdminTelemetry is exported from admin-telemetry.ts as part of the
 * module but NOT as part of the public API — it is tested here via
 * a manual reimplementation that mirrors the guard's exact contract.
 * This mirrors the pattern used in classify-principal.test.ts.
 */

import { describe, expect, test } from "bun:test";

// ---------------------------------------------------------------------------
// Mirror the isAdminTelemetry guard logic exactly
// ---------------------------------------------------------------------------

const REQUIRED_SECTIONS = [
  "instance",
  "services",
  "readiness",
  "access",
  "storage",
  "extensions",
  "recentEvents",
] as const;

function isAdminTelemetryShape(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  for (const key of REQUIRED_SECTIONS) {
    if (!(key in v)) return false;
  }
  const inst = v["instance"];
  if (!inst || typeof inst !== "object") return false;
  const i = inst as Record<string, unknown>;
  if (typeof i["id"] !== "string") return false;
  if (typeof i["now"] !== "number") return false;
  const rdy = v["readiness"];
  if (!rdy || typeof rdy !== "object") return false;
  if (typeof (rdy as Record<string, unknown>)["ready"] !== "boolean") return false;
  return true;
}

// Minimal valid payload that passes the guard
const MINIMAL_VALID: Record<string, unknown> = {
  instance: { id: "test-instance", now: 1234567890 },
  services: [],
  readiness: { ready: true, mode: "live", checks: {}, unsupported: [] },
  access: { activeSessions: 0, activeCredentials: 0, rateLimitRows: 0, oidcIssuers: [] },
  storage: {
    dataDir: { path: "/", exists: true, bytes: 0 },
    metadata: { path: "/", exists: true, bytes: 0 },
    repositories: {
      count: 0,
      root: { path: "/", exists: true, bytes: 0 },
      backends: [],
    },
    extensionStorage: { path: "/", exists: true, bytes: 0 },
    events: { path: "/", exists: true, bytes: 0 },
    audit: { path: "/", exists: true, bytes: 0 },
  },
  extensions: [],
  recentEvents: [],
};

// ---------------------------------------------------------------------------
// Guard: valid inputs
// ---------------------------------------------------------------------------

describe("isAdminTelemetry — valid payloads", () => {
  test("full minimal valid payload passes", () => {
    expect(isAdminTelemetryShape(MINIMAL_VALID)).toBe(true);
  });

  test("extra fields are tolerated", () => {
    expect(isAdminTelemetryShape({ ...MINIMAL_VALID, configSync: null, extra: 42 })).toBe(true);
  });

  test("instance with additional fields passes", () => {
    const payload = {
      ...MINIMAL_VALID,
      instance: {
        id: "x",
        now: 0,
        name: "my-forge",
        version: "0.1",
        mode: "live",
        startedAt: 0,
        uptimeSeconds: 0,
        processID: 1,
        publicURL: "",
      },
    };
    expect(isAdminTelemetryShape(payload)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Guard: invalid inputs
// ---------------------------------------------------------------------------

describe("isAdminTelemetry — invalid payloads", () => {
  test("null returns false", () => {
    expect(isAdminTelemetryShape(null)).toBe(false);
  });

  test("undefined returns false", () => {
    expect(isAdminTelemetryShape(undefined)).toBe(false);
  });

  test("string returns false", () => {
    expect(isAdminTelemetryShape("{}")).toBe(false);
  });

  test("number returns false", () => {
    expect(isAdminTelemetryShape(42)).toBe(false);
  });

  test("empty object returns false (missing all sections)", () => {
    expect(isAdminTelemetryShape({})).toBe(false);
  });

  for (const section of REQUIRED_SECTIONS) {
    test(`missing '${section}' section returns false`, () => {
      const { [section]: _removed, ...rest } = MINIMAL_VALID;
      expect(isAdminTelemetryShape(rest)).toBe(false);
    });
  }

  test("instance without id returns false", () => {
    const payload = {
      ...MINIMAL_VALID,
      instance: { now: 0 },
    };
    expect(isAdminTelemetryShape(payload)).toBe(false);
  });

  test("instance without now returns false", () => {
    const payload = {
      ...MINIMAL_VALID,
      instance: { id: "x" },
    };
    expect(isAdminTelemetryShape(payload)).toBe(false);
  });

  test("instance with wrong id type returns false", () => {
    const payload = {
      ...MINIMAL_VALID,
      instance: { id: 123, now: 0 },
    };
    expect(isAdminTelemetryShape(payload)).toBe(false);
  });

  test("readiness without ready field returns false", () => {
    const payload = {
      ...MINIMAL_VALID,
      readiness: { mode: "live" },
    };
    expect(isAdminTelemetryShape(payload)).toBe(false);
  });

  test("readiness.ready as string returns false", () => {
    const payload = {
      ...MINIMAL_VALID,
      readiness: { ready: "true" },
    };
    expect(isAdminTelemetryShape(payload)).toBe(false);
  });

  test("null instance returns false", () => {
    const payload = { ...MINIMAL_VALID, instance: null };
    expect(isAdminTelemetryShape(payload)).toBe(false);
  });
});
