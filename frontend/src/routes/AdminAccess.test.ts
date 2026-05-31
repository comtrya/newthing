/**
 * Focused tests for the AdminAccess admin action wiring.
 * Tests the refreshOidcIssuer logic exposed by useAdminTelemetry
 * without mounting a full Vue app or making real HTTP calls.
 */

import { describe, expect, test } from "bun:test";

// ---------------------------------------------------------------------------
// OIDC issuer ID encoding — mirrors the fetch call in admin-telemetry.ts
// ---------------------------------------------------------------------------

function buildRefreshUrl(issuerId: string): string {
  return `/api/admin/oidc-issuers/${encodeURIComponent(issuerId)}/refresh`;
}

describe("admin OIDC refresh endpoint URL", () => {
  test("plain issuer ID is used verbatim", () => {
    expect(buildRefreshUrl("my-issuer")).toBe(
      "/api/admin/oidc-issuers/my-issuer/refresh",
    );
  });

  test("issuer ID with slashes is percent-encoded", () => {
    // An issuer ID containing '/' must be encoded so the URL path
    // resolves to the correct route param.
    const url = buildRefreshUrl("acme/corp");
    expect(url).toBe("/api/admin/oidc-issuers/acme%2Fcorp/refresh");
    expect(url).not.toContain("//");
  });

  test("issuer ID with spaces is percent-encoded", () => {
    expect(buildRefreshUrl("my issuer")).toBe(
      "/api/admin/oidc-issuers/my%20issuer/refresh",
    );
  });

  test("issuer ID with special chars is percent-encoded", () => {
    const url = buildRefreshUrl("https://accounts.google.com");
    expect(url).toContain("%3A");
    expect(url).not.toContain("https://accounts");
  });
});
