import { afterEach, describe, expect, test } from "bun:test";

import {
  _resetSessionForTesting,
  clearSessionToken,
  getSessionToken,
} from "./session";

afterEach(() => {
  _resetSessionForTesting();
});

function mockFetchOK(body: Record<string, unknown>): typeof fetch {
  return (async () =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    })) as unknown as typeof fetch;
}

describe("session bootstrap", () => {
  test("exchanges operator-code for an access token on first call", async () => {
    let captured: { url: string; init: RequestInit } | undefined;
    const fetchImpl = (async (url: string, init: RequestInit) => {
      captured = { url, init };
      return new Response(
        JSON.stringify({ accessToken: "tok_abc", expiresIn: 1800 }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    const token = await getSessionToken({
      operatorCode: "op-code-xyz",
      fetchImpl,
    });

    expect(token).toBe("tok_abc");
    expect(captured?.url).toBe("/auth/token-exchange");
    const body = JSON.parse((captured?.init?.body as string) ?? "{}");
    expect(body.grantType).toBe("urn:comtrya:grant:operator-code");
    expect(body.subjectToken).toBe("op-code-xyz");
    expect(body.requestedActions).toContain("graphql:read");
  });

  test("caches the token between calls", async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls += 1;
      return new Response(
        JSON.stringify({ accessToken: "tok_1", expiresIn: 1800 }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    const first = await getSessionToken({ operatorCode: "op", fetchImpl });
    const second = await getSessionToken({ operatorCode: "op", fetchImpl });

    expect(first).toBe("tok_1");
    expect(second).toBe("tok_1");
    expect(calls).toBe(1);
  });

  test("dedupes concurrent bootstraps into one request", async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls += 1;
      // Force concurrency: don't resolve until the second caller has
      // entered getSessionToken.
      await new Promise((r) => setTimeout(r, 5));
      return new Response(
        JSON.stringify({ accessToken: "tok_x", expiresIn: 1800 }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    const [a, b] = await Promise.all([
      getSessionToken({ operatorCode: "op", fetchImpl }),
      getSessionToken({ operatorCode: "op", fetchImpl }),
    ]);

    expect(a).toBe("tok_x");
    expect(b).toBe("tok_x");
    expect(calls).toBe(1);
  });

  test("clearSessionToken forces a fresh exchange on next call", async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls += 1;
      return new Response(
        JSON.stringify({ accessToken: `tok_${calls}`, expiresIn: 1800 }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    expect(await getSessionToken({ operatorCode: "op", fetchImpl })).toBe(
      "tok_1",
    );
    clearSessionToken();
    expect(await getSessionToken({ operatorCode: "op", fetchImpl })).toBe(
      "tok_2",
    );
    expect(calls).toBe(2);
  });

  test("redirects to OIDC login when no operator-code is available", async () => {
    let redirectedTo: string | undefined;
    const token = await getSessionToken({
      operatorCode: undefined,
      redirectTo: (url) => {
        redirectedTo = url;
      },
      fetchImpl: mockFetchOK({}),
    });

    expect(token).toBeUndefined();
    expect(redirectedTo).toBe("/auth/oidc/google/login");
  });

  test("honours a custom oidcLoginPath", async () => {
    let redirectedTo: string | undefined;
    await getSessionToken({
      operatorCode: undefined,
      oidcLoginPath: "/auth/oidc/bluesky/login",
      redirectTo: (url) => {
        redirectedTo = url;
      },
      fetchImpl: mockFetchOK({}),
    });
    expect(redirectedTo).toBe("/auth/oidc/bluesky/login");
  });

  test("throws if token-exchange returns a non-2xx", async () => {
    const fetchImpl = (async () =>
      new Response("operator-code invalid", { status: 401 })) as unknown as typeof fetch;

    await expect(
      getSessionToken({ operatorCode: "bad", fetchImpl }),
    ).rejects.toThrow(/token-exchange failed \(401\)/);
  });

  test("throws if response is missing accessToken", async () => {
    const fetchImpl = mockFetchOK({ expiresIn: 1800 });
    await expect(
      getSessionToken({ operatorCode: "op", fetchImpl }),
    ).rejects.toThrow(/missing accessToken/);
  });
});
