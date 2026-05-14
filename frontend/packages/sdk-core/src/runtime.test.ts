import { afterEach, expect, test } from "bun:test";

import { invokeOp } from "./runtime";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
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
