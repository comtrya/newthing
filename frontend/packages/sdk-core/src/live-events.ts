/**
 * SSE-backed live event subscription. The kernel issues a single-use
 * stream session at `/events/session`, then streams events from `/events`.
 *
 * Each event delivered to the callback is the JSON form of `event` from
 * the platform WIT (id, eventType, payloadB64 base64 string,
 * timestampMs, sourceUri, emitterExtension).
 */

export interface LiveEvent {
  id: string;
  eventType: string;
  /** base64 of the original payload bytes. */
  payloadB64: string;
  timestampMs: number;
  sourceUri: string;
  emitterExtension: string;
  raw: unknown;
}

export interface SubscribeOptions {
  baseUrl?: string;
  /** Filter by event type (literal match; globs are kernel-side). */
  type?: string;
  /** Filter by emitter extension. */
  source?: string;
  /** Called with each delivered event. */
  onEvent: (event: LiveEvent) => void;
  /** Called when the stream errors. */
  onError?: (error: Event | Error) => void;
}

export function subscribeLiveEvents(opts: SubscribeOptions): () => void {
  const base = opts.baseUrl ?? "";
  const controller = new AbortController();
  void streamEvents(base, opts, controller.signal);
  return () => controller.abort();
}

async function streamEvents(
  base: string,
  opts: SubscribeOptions,
  signal: AbortSignal,
): Promise<void> {
  try {
    const session = await issueStreamSession(base, signal);
    const url = `${base}/events?session=${encodeURIComponent(session)}`;
    const response = await fetch(url, {
      credentials: "include",
      headers: { Accept: "text/event-stream" },
      signal,
    });
    if (!response.ok) throw new Error(`event stream failed: HTTP ${response.status}`);
    await readEventStream(response, opts, signal);
  } catch (error) {
    if (signal.aborted) return;
    opts.onError?.(error instanceof Error ? error : new Error(String(error)));
  }
}

async function issueStreamSession(base: string, signal: AbortSignal): Promise<string> {
  const response = await fetch(`${base}/events/session`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: "{}",
    signal,
  });
  const body = (await response.json()) as {
    session?: string;
    errors?: Array<{ message?: string }>;
  };
  if (!response.ok || !body.session) {
    throw new Error(body.errors?.[0]?.message ?? "event stream session failed");
  }
  return body.session;
}

async function readEventStream(
  response: Response,
  opts: SubscribeOptions,
  signal: AbortSignal,
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) {
    parseFrames(await response.text(), opts);
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";
  while (!signal.aborted) {
    const next = await reader.read();
    if (next.done) break;
    buffer += decoder.decode(next.value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) parseFrame(frame, opts);
  }
  buffer += decoder.decode();
  parseFrames(buffer, opts);
}

function parseFrames(text: string, opts: SubscribeOptions): void {
  for (const frame of text.split("\n\n")) parseFrame(frame, opts);
}

function parseFrame(frame: string, opts: SubscribeOptions): void {
  const lines = frame.split("\n");
  const eventName = lines
    .find((line) => line.startsWith("event: "))
    ?.slice("event: ".length);
  const data = lines
    .filter((line) => line.startsWith("data: "))
    .map((line) => line.slice("data: ".length))
    .join("\n");
  if (!data) return;
  try {
    const parsed = JSON.parse(data) as unknown;
    const event = normalizeLiveEvent(parsed, eventName);
    if (opts.type && event.eventType !== opts.type) return;
    if (
      opts.source &&
      event.emitterExtension !== opts.source &&
      event.sourceUri !== opts.source
    ) {
      return;
    }
    opts.onEvent(event);
  } catch {
    // Ignore malformed stream frames.
  }
}

function normalizeLiveEvent(raw: unknown, eventName?: string): LiveEvent {
  const object = isRecord(raw) ? raw : {};
  const data = isRecord(object.data) ? object.data : {};
  const eventType = stringValue(data.eventType) ?? stringValue(object.type) ?? eventName ?? "";
  return {
    id: stringValue(data.id) ?? stringValue(object.id) ?? "",
    eventType,
    payloadB64: stringValue(data.payloadB64) ?? "",
    timestampMs:
      numberValue(data.timestampMs) ??
      secondsToTimestampMs(numberValue(object.time)) ??
      Date.now(),
    sourceUri: stringValue(data.sourceUri) ?? stringValue(object.source) ?? "",
    emitterExtension:
      stringValue(data.emitterExtension) ??
      stringValue(data.extensionId) ??
      stringValue(object.source) ??
      "",
    raw,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function secondsToTimestampMs(value: number | undefined): number | undefined {
  return value === undefined ? undefined : value * 1000;
}
