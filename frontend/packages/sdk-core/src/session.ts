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

interface SharedSessionState {
  current?: SessionState;
  inflight?: Promise<string | undefined>;
}

const SESSION_STATE_KEY = "__comtryaSessionState";
const OPERATOR_CODE_KEY = "__comtryaOperatorCode";

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
  const state = sharedSessionState();
  if (state.current && state.current.expiresAtMs > Date.now() + 5_000) {
    return state.current.token;
  }
  if (!state.inflight) {
    const pending = bootstrap(options).finally(() => {
      if (sharedSessionState().inflight === pending) {
        sharedSessionState().inflight = undefined;
      }
    });
    state.inflight = pending;
  }
  return state.inflight;
}

/** Clears the cached session. Called by transports when they receive 401. */
export function clearSessionToken(): void {
  sharedSessionState().current = undefined;
}

/** Test-only — fully reset module state. */
export function _resetSessionForTesting(): void {
  const state = sharedSessionState();
  state.current = undefined;
  state.inflight = undefined;
  sharedSessionGlobal()[OPERATOR_CODE_KEY] = undefined;
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
  const current = {
    token: body.accessToken,
    expiresAtMs: Date.now() + ttlMs,
  };
  sharedSessionState().current = current;
  return current.token;
}

function sharedSessionState(): SharedSessionState {
  const global = sharedSessionGlobal();
  global[SESSION_STATE_KEY] ??= {};
  return global[SESSION_STATE_KEY];
}

function readBuildEnv(): string | undefined {
  const sharedOperatorCode = sharedSessionGlobal()[OPERATOR_CODE_KEY];
  if (sharedOperatorCode) return sharedOperatorCode;

  // Vite inlines `import.meta.env.PUBLIC_*` at build time when
  // `envPrefix` includes `PUBLIC_`. Outside Vite (Node/Bun tests),
  // `import.meta.env` may be undefined — guard accordingly.
  try {
    const env = (import.meta as ImportMeta & { env?: Record<string, string> })
      .env;
    const operatorCode = env?.PUBLIC_COMTRYA_OPERATOR_CODE;
    if (operatorCode) {
      sharedSessionGlobal()[OPERATOR_CODE_KEY] = operatorCode;
    }
    return operatorCode;
  } catch {
    return undefined;
  }
}

function sharedSessionGlobal(): typeof globalThis & {
  [SESSION_STATE_KEY]?: SharedSessionState;
  [OPERATOR_CODE_KEY]?: string;
} {
  return globalThis as typeof globalThis & {
    [SESSION_STATE_KEY]?: SharedSessionState;
    [OPERATOR_CODE_KEY]?: string;
  };
}
