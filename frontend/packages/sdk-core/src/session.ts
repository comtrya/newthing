/**
 * Session bootstrap for the dev/testbed flow.
 *
 * The kernel rejects anonymous principals on every non-public surface
 * (#16 lockdown). The shell needs a session token before its first
 * GraphQL or `/api/ops/*` call, otherwise every read 401s.
 *
 * In the testbed, that token is minted by exchanging
 * `PUBLIC_COMTRYA_OPERATOR_CODE` (a build-time env exposed by
 * `start.sh`) at `POST /auth/token-exchange`. In production the
 * operator-code grant is absent; the shell instead redirects to
 * `/auth/oidc/:provider/login`, the callback issues the session, and
 * subsequent loads hit the cookie path (no exchange needed).
 *
 * This module is intentionally tiny: one in-memory token, one
 * exchange, one 401-driven re-bootstrap. Refresh-on-expiry and
 * multi-tab synchronisation are deferred — the existing 30-min TTL
 * is long enough that a single browser session almost never sees
 * expiry, and refresh adds enough complexity that it earns its own
 * follow-up.
 */

interface SessionState {
  token: string;
  expiresAtMs: number;
}

let current: SessionState | undefined;
let inflight: Promise<string | undefined> | undefined;

export interface SessionBootstrapOptions {
  /** Override the kernel base URL (defaults to same-origin). */
  baseUrl?: string;
  /** Override the operator-code (defaults to the build-inlined env var). */
  operatorCode?: string;
  /** Override fetch (used by tests). */
  fetchImpl?: typeof fetch;
}

/** Returns the current session token, bootstrapping one if needed. */
export async function getSessionToken(
  options: SessionBootstrapOptions = {},
): Promise<string | undefined> {
  if (current && current.expiresAtMs > Date.now() + 5_000) {
    return current.token;
  }
  if (!inflight) {
    inflight = bootstrap(options).finally(() => {
      inflight = undefined;
    });
  }
  return inflight;
}

/** Clears the cached session. Called by transports when they receive 401. */
export function clearSessionToken(): void {
  current = undefined;
}

/** Test-only — fully reset module state. */
export function _resetSessionForTesting(): void {
  current = undefined;
  inflight = undefined;
}

async function bootstrap(
  options: SessionBootstrapOptions,
): Promise<string | undefined> {
  const operatorCode = options.operatorCode ?? readBuildEnv();
  const fetchImpl = options.fetchImpl ?? fetch;
  const baseUrl = options.baseUrl ?? "";

  if (!operatorCode) {
    // Zero-auth: proceed anonymously (read-only public access). The shell no
    // longer force-redirects to OIDC on load; sign-in is an explicit user
    // action. Anonymous reads succeed for public surfaces; private/admin
    // surfaces require an authenticated (OIDC admin / operator-code) session.
    return undefined;
  }

  const response = await fetchImpl(`${baseUrl}/auth/token-exchange`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      grantType: "urn:comtrya:grant:operator-code",
      subjectToken: operatorCode,
      subjectTokenType: "urn:comtrya:token-type:operator-code",
      requestedResource: "comtrya://workspace",
      requestedActions: [
        "graphql:read",
        "graphql:write",
        "events:read",
        "git:read",
        "checks:read",
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(
      `token-exchange failed (${response.status}): ${await response.text()}`,
    );
  }
  const body = (await response.json()) as {
    accessToken?: string;
    expiresIn?: number;
  };
  if (!body.accessToken) {
    throw new Error("token-exchange response missing accessToken");
  }
  const ttlMs = (body.expiresIn ?? 1800) * 1000;
  current = {
    token: body.accessToken,
    expiresAtMs: Date.now() + ttlMs,
  };
  return current.token;
}

function readBuildEnv(): string | undefined {
  // Vite inlines `import.meta.env.PUBLIC_*` at build time when
  // `envPrefix` includes `PUBLIC_`. Outside Vite (Node/Bun tests),
  // `import.meta.env` may be undefined — guard accordingly.
  try {
    const env = (import.meta as ImportMeta & { env?: Record<string, string> })
      .env;
    return env?.PUBLIC_COMTRYA_OPERATOR_CODE;
  } catch {
    return undefined;
  }
}
