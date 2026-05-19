import { afterEach, describe, expect, mock, test } from "bun:test";
import {
  _resetGraphQLClientForTesting,
  configureGraphQLClient,
  getGraphQLClient,
} from "./graphql-client";

afterEach(() => _resetGraphQLClientForTesting());

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("graphql-client", () => {
  test("posts query and unwraps data", async () => {
    const fetchImpl = mock(async () =>
      jsonResponse({ data: { viewer: { authenticated: true } } }),
    ) as unknown as typeof fetch;
    const client = configureGraphQLClient({ fetchImpl });
    const result = await client.query<{ viewer: { authenticated: boolean } }>(
      "{ viewer { authenticated } }",
    );
    expect(result.viewer.authenticated).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  test("throws on GraphQL errors envelope", async () => {
    const fetchImpl = mock(async () =>
      jsonResponse({ errors: [{ message: "boom" }] }),
    ) as unknown as typeof fetch;
    const client = configureGraphQLClient({ fetchImpl });
    await expect(client.query("{}")).rejects.toThrow("boom");
  });

  test("throws when response is not ok", async () => {
    const fetchImpl = mock(async () =>
      jsonResponse({ data: null }, { status: 500, statusText: "Server" }),
    ) as unknown as typeof fetch;
    const client = configureGraphQLClient({ fetchImpl });
    await expect(client.query("{}")).rejects.toThrow();
  });

  test("getGraphQLClient returns the configured client", () => {
    const fetchImpl = mock(() => undefined) as unknown as typeof fetch;
    const configured = configureGraphQLClient({ fetchImpl });
    expect(getGraphQLClient()).toBe(configured);
  });
});
