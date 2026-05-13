/**
 * SSE-backed live event subscription. The kernel streams `events.event`
 * records as Server-Sent Events at `/events/stream`. Extensions
 * subscribe via this helper to react in the UI.
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
  onError?: (error: Event) => void;
}

export function subscribeLiveEvents(opts: SubscribeOptions): () => void {
  const base = opts.baseUrl ?? "";
  const params = new URLSearchParams();
  if (opts.type) params.set("type", opts.type);
  if (opts.source) params.set("source", opts.source);
  const url = `${base}/events/stream${params.size > 0 ? `?${params}` : ""}`;
  const source = new EventSource(url, { withCredentials: true });
  source.addEventListener("event", (e: MessageEvent) => {
    try {
      const parsed = JSON.parse(e.data) as LiveEvent;
      opts.onEvent(parsed);
    } catch {
      // ignore malformed
    }
  });
  if (opts.onError) source.addEventListener("error", opts.onError);
  return () => source.close();
}
