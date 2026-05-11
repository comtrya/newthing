import type { EventFilter, ForgepointClient, ForgepointEvent } from "./contracts";

type GraphqlEnvelope<TData> = {
  data?: TData;
  errors?: Array<{ message: string; extensions?: { code?: string } }>;
};

export class HttpForgepointClient implements ForgepointClient {
  constructor(
    private readonly baseURL: string,
    private readonly eventSessionFactory: () => Promise<string>,
  ) {}

  async query<TData = unknown, TVars = Record<string, unknown>>(
    document: string,
    variables?: TVars,
    opts?: { signal?: AbortSignal; operationName?: string },
  ): Promise<TData> {
    return this.graphql(document, variables, opts);
  }

  async mutate<TData = unknown, TVars = Record<string, unknown>>(
    document: string,
    variables?: TVars,
    opts?: { signal?: AbortSignal; operationName?: string },
  ): Promise<TData> {
    return this.graphql(document, variables, opts);
  }

  async *subscribe<TData = unknown, TVars = Record<string, unknown>>(
    document: string,
    variables?: TVars,
    opts?: { signal?: AbortSignal; operationName?: string },
  ): AsyncIterable<TData> {
    const session = await this.eventSessionFactory();
    const url = new URL("/graphql/stream", this.baseURL);
    url.searchParams.set("session", session);
    url.searchParams.set("query", document);
    if (variables) {
      url.searchParams.set("variables", JSON.stringify(variables));
    }
    if (opts?.operationName) {
      url.searchParams.set("operationName", opts.operationName);
    }
    yield* this.eventSource<TData>(url, opts?.signal);
  }

  async permissions(resourceURN: string): Promise<string[]> {
    const data = await this.query<{ viewer: { permissions: string[] } }>(
      "query Permissions($resource: ResourceURN!) { viewer { permissions(resource: $resource) } }",
      { resource: resourceURN },
    );
    return data.viewer.permissions;
  }

  async *events(
    filter?: EventFilter,
    opts?: { signal?: AbortSignal },
  ): AsyncIterable<ForgepointEvent> {
    const session = await this.eventSessionFactory();
    const url = new URL("/events", this.baseURL);
    url.searchParams.set("session", session);
    if (filter?.resource) {
      url.searchParams.set("resource", filter.resource);
    }
    for (const type of filter?.types ?? []) {
      url.searchParams.append("type", type);
    }
    yield* this.eventSource<ForgepointEvent>(url, opts?.signal);
  }

  navigate(path: string, opts?: { replace?: boolean }): void {
    if (opts?.replace) {
      window.history.replaceState(null, "", path);
    } else {
      window.history.pushState(null, "", path);
    }
  }

  toast(level: "info" | "success" | "warn" | "error", message: string): void {
    window.dispatchEvent(new CustomEvent("forgepoint:toast", { detail: { level, message } }));
  }

  private async graphql<TData, TVars>(
    document: string,
    variables?: TVars,
    opts?: { signal?: AbortSignal; operationName?: string },
  ): Promise<TData> {
    const response = await fetch(new URL("/graphql", this.baseURL), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: document, variables, operationName: opts?.operationName }),
      signal: opts?.signal,
    });
    const envelope = (await response.json()) as GraphqlEnvelope<TData>;
    if (envelope.errors?.length) {
      const first = envelope.errors[0];
      const code = first?.extensions?.code ?? "INTERNAL_SERVER_ERROR";
      throw Object.assign(new Error(first?.message ?? "GraphQL request failed"), { code });
    }
    if (!envelope.data) {
      throw Object.assign(new Error("GraphQL response did not include data"), {
        code: "INTERNAL_SERVER_ERROR",
      });
    }
    return envelope.data;
  }

  private async *eventSource<TData>(url: URL, signal?: AbortSignal): AsyncIterable<TData> {
    const response = await fetch(url, {
      credentials: "include",
      headers: { Accept: "text/event-stream" },
      signal,
    });
    const text = await response.text();
    for (const frame of text.split("\n\n")) {
      const dataLine = frame.split("\n").find((line) => line.startsWith("data: "));
      if (dataLine) {
        yield JSON.parse(dataLine.slice("data: ".length)) as TData;
      }
    }
  }
}
