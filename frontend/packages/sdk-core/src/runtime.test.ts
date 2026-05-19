import { afterEach, describe, expect, test } from "bun:test";

import { invokeOp } from "./runtime";
import { _resetSessionForTesting } from "./session";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  _resetSessionForTesting();
});

test("invokeOp posts to the canonical ops endpoint", async () => {
  let captured:
    | {
        input: RequestInfo | URL;
        init?: RequestInit;
      }
    | undefined;

  globalThis.fetch = (async (input, init) => {
    captured = { input, init };
    return new Response(JSON.stringify({ id: "iss_1" }), { status: 200 });
  }) as typeof fetch;

  const result = await invokeOp(
    "ext_issues",
    "issues",
    "open-issue",
    { title: "Example" },
    { baseUrl: "http://kernel.test", token: "token-123" },
  );

  expect(result).toEqual({ ok: true, value: { id: "iss_1" } });
  expect(String(captured?.input)).toBe(
    "http://kernel.test/api/ops/ext_issues/issues/open-issue",
  );
  expect(captured?.init?.method).toBe("POST");
  expect(captured?.init?.credentials).toBe("include");
  expect(captured?.init?.body).toBe(JSON.stringify({ title: "Example" }));
  expect(captured?.init?.headers).toMatchObject({
    authorization: "Bearer token-123",
    "content-type": "application/json",
  });
});

describe("invokeOp error mapping", () => {
  function mockOnce(status: number, body: string | object = ""): void {
    globalThis.fetch = (async () =>
      new Response(
        typeof body === "string" ? body : JSON.stringify(body),
        { status, statusText: `status-${status}` },
      )) as unknown as typeof fetch;
  }

  test("400 → 'bad-input'", async () => {
    mockOnce(400, { code: "bad-input", message: "missing field" });
    const r = await invokeOp("ext", "i", "op", null, { token: "t" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe("bad-input");
      expect(r.error.message).toBe("missing field");
    }
  });

  test("401 → 'unauthenticated'", async () => {
    mockOnce(401, { code: "unauthenticated", message: "no session" });
    const r = await invokeOp("ext", "i", "op", null, { token: "t" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("unauthenticated");
  });

  test("403 → 'forbidden'", async () => {
    mockOnce(403);
    const r = await invokeOp("ext", "i", "op", null, { token: "t" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("forbidden");
  });

  test("404 → 'not-found' when server omits a code", async () => {
    mockOnce(404, "nothing here");
    const r = await invokeOp("ext", "i", "missing", null, { token: "t" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("not-found");
  });

  test("409 → 'conflict' carrying the server-provided message", async () => {
    mockOnce(409, { code: "conflict", message: "already exists" });
    const r = await invokeOp("ext", "i", "create", null, { token: "t" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe("conflict");
      expect(r.error.message).toBe("already exists");
    }
  });

  test("503 → 'unavailable'", async () => {
    mockOnce(503);
    const r = await invokeOp("ext", "i", "x", null, { token: "t" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("unavailable");
  });

  test("500 (unmapped) → 'internal'", async () => {
    mockOnce(500, "");
    const r = await invokeOp("ext", "i", "boom", null, { token: "t" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("internal");
  });

  test("fetch rejection → 'unavailable' with error message", async () => {
    globalThis.fetch = (async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;
    const r = await invokeOp("ext", "i", "x", null, { token: "t" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe("unavailable");
      expect(r.error.message).toContain("network down");
    }
  });

  test("non-Error throwable still degrades cleanly to 'unavailable'", async () => {
    globalThis.fetch = (async () => {
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw "string failure";
    }) as unknown as typeof fetch;
    const r = await invokeOp("ext", "i", "x", null, { token: "t" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("unavailable");
  });

  test("unparseable error body falls back to plain text or statusText", async () => {
    globalThis.fetch = (async () =>
      new Response("</not json", { status: 500, statusText: "Boom" })) as
      unknown as typeof fetch;
    const r = await invokeOp("ext", "i", "x", null, { token: "t" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe("internal");
      // either the body text or the statusText is acceptable; both are
      // distinguishable from the "internal" code default.
      expect(r.error.message.length).toBeGreaterThan(0);
    }
  });

  test("server-supplied code wins over status mapping", async () => {
    mockOnce(500, { code: "conflict", message: "soft conflict" });
    const r = await invokeOp("ext", "i", "x", null, { token: "t" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe("conflict");
      expect(r.error.message).toBe("soft conflict");
    }
  });

  test("server-supplied path is surfaced", async () => {
    mockOnce(400, {
      code: "bad-input",
      message: "value is required",
      path: "/title",
    });
    const r = await invokeOp("ext", "i", "x", null, { token: "t" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.path).toBe("/title");
  });
});

describe("invokeOp request shaping", () => {
  test("default body when input omitted is JSON null", async () => {
    let body: BodyInit | null | undefined;
    globalThis.fetch = (async (_url, init?: RequestInit) => {
      body = init?.body;
      return new Response("null", { status: 200 });
    }) as unknown as typeof fetch;
    await invokeOp("ext", "i", "op", undefined, { token: "t" });
    expect(body).toBe("null");
  });

  test("baseUrl override is honored verbatim", async () => {
    let url: string | undefined;
    globalThis.fetch = (async (u: string) => {
      url = u;
      return new Response("null", { status: 200 });
    }) as unknown as typeof fetch;
    await invokeOp("ext", "i", "x", null, {
      baseUrl: "https://kernel.example",
      token: "t",
    });
    expect(url).toBe("https://kernel.example/api/ops/ext/i/x");
  });

  test("path segments are URL-encoded", async () => {
    let url: string | undefined;
    globalThis.fetch = (async (u: string) => {
      url = u;
      return new Response("null", { status: 200 });
    }) as unknown as typeof fetch;
    await invokeOp("ext slash/here", "iface+plus", "op&q", null, { token: "t" });
    expect(url).toBe(
      "/api/ops/ext%20slash%2Fhere/iface%2Bplus/op%26q",
    );
  });

  test("missing token omits the Authorization header", async () => {
    let headers: Record<string, string> | undefined;
    globalThis.fetch = (async (_u, init?: RequestInit) => {
      headers = init?.headers as Record<string, string>;
      return new Response("null", { status: 200 });
    }) as unknown as typeof fetch;
    await invokeOp("ext", "i", "x");
    expect(headers).toBeDefined();
    expect(headers?.["authorization"]).toBeUndefined();
  });
});
