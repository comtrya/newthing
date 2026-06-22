import { afterEach, expect, test } from "bun:test";
import { subscribeLiveEvents, type LiveEvent } from "./live-events";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("subscribeLiveEvents calls onOpen before delivering stream events", async () => {
  const calls: string[] = [];
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = (async (input, init) => {
    const url = String(input);
    requests.push({ url, init });
    if (url === "/events/session") {
      return jsonResponse({ session: "stream-session" });
    }
    if (url === "/events?session=stream-session") {
      return new Response(
        sseFrame("issue.created", {
          data: {
            id: "evt_1",
            eventType: "issue.created",
            payloadB64: "",
            timestampMs: 1_717_000_000_000,
            sourceUri: "comtrya://workspace/ws/issue/1",
            emitterExtension: "ext_issues",
          },
        }),
        { status: 200 },
      );
    }
    return new Response("not found", { status: 404 });
  }) as typeof fetch;

  let unsubscribe = () => {};
  try {
    const event = await new Promise<LiveEvent>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("timed out waiting for live event")),
        500,
      );
      unsubscribe = subscribeLiveEvents({
        onOpen: () => calls.push("open"),
        onEvent: (received) => {
          calls.push("event");
          clearTimeout(timeout);
          resolve(received);
        },
        onError: reject,
      });
    });

    expect(calls).toEqual(["open", "event"]);
    expect(event.eventType).toBe("issue.created");
    expect(requests.map((request) => request.url)).toEqual([
      "/events/session",
      "/events?session=stream-session",
    ]);
    expect(headerValue(requests[0]?.init, "Authorization")).toBeUndefined();
    expect(headerValue(requests[1]?.init, "Authorization")).toBeUndefined();
  } finally {
    unsubscribe();
  }
});

test("subscribeLiveEvents sends bearer auth only when a token is supplied", async () => {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = (async (input, init) => {
    const url = String(input);
    requests.push({ url, init });
    if (url === "/events/session") {
      return jsonResponse({ session: "stream-session" });
    }
    return new Response("", { status: 200 });
  }) as typeof fetch;

  let unsubscribe = () => {};
  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("timed out waiting for stream open")),
        500,
      );
      unsubscribe = subscribeLiveEvents({
        token: "test-token",
        onOpen: () => {
          clearTimeout(timeout);
          resolve();
        },
        onEvent: () => {},
        onError: reject,
      });
    });
    await waitUntil(() => requests.length === 2);

    expect(headerValue(requests[0]?.init, "Authorization")).toBe(
      "Bearer test-token",
    );
    expect(headerValue(requests[1]?.init, "Authorization")).toBe(
      "Bearer test-token",
    );
  } finally {
    unsubscribe();
  }
});

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function sseFrame(event: string, body: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(body)}\n\n`;
}

function headerValue(init: RequestInit | undefined, name: string): string | undefined {
  const headers = init?.headers;
  if (!headers) return undefined;
  if (headers instanceof Headers) return headers.get(name) ?? undefined;
  if (Array.isArray(headers)) {
    return headers.find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1];
  }
  return (headers as Record<string, string>)[name];
}

async function waitUntil(predicate: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error("condition was not met");
}
