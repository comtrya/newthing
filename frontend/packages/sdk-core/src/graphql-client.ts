/**
 * Shared GraphQL client.
 *
 * One transport, one auth wiring, one error envelope. The shell
 * configures the endpoint at boot; extensions and shell components
 * both consume `getGraphQLClient()` rather than hand-rolling
 * `fetch("/graphql", ...)` calls.
 */

export interface GraphQLClient {
  query<T = unknown>(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<T>;
  mutate<T = unknown>(
    mutation: string,
    variables?: Record<string, unknown>,
  ): Promise<T>;
}

export interface GraphQLClientOptions {
  endpoint?: string;
  credentials?: RequestCredentials;
  fetchImpl?: typeof fetch;
}

interface GraphQLResponseEnvelope<T> {
  data?: T;
  errors?: Array<{ message?: string }>;
}

const DEFAULT_OPTIONS: Required<GraphQLClientOptions> = {
  endpoint: "/graphql",
  credentials: "include",
  fetchImpl:
    typeof fetch !== "undefined"
      ? fetch.bind(globalThis)
      : (() => {
          throw new Error("no fetch implementation available");
        }) as typeof fetch,
};

let CURRENT: GraphQLClient | undefined;

export function configureGraphQLClient(
  options: GraphQLClientOptions = {},
): GraphQLClient {
  const merged: Required<GraphQLClientOptions> = {
    endpoint: options.endpoint ?? DEFAULT_OPTIONS.endpoint,
    credentials: options.credentials ?? DEFAULT_OPTIONS.credentials,
    fetchImpl: options.fetchImpl ?? DEFAULT_OPTIONS.fetchImpl,
  };
  CURRENT = createClient(merged);
  return CURRENT;
}

export function getGraphQLClient(): GraphQLClient {
  if (!CURRENT) CURRENT = createClient(DEFAULT_OPTIONS);
  return CURRENT;
}

/** Test-only — clears the configured client so the next call lazy-creates. */
export function _resetGraphQLClientForTesting(): void {
  CURRENT = undefined;
}

function createClient(options: Required<GraphQLClientOptions>): GraphQLClient {
  const call = async <T>(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<T> => {
    const response = await options.fetchImpl(options.endpoint, {
      method: "POST",
      credentials: options.credentials,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
    let envelope: GraphQLResponseEnvelope<T>;
    try {
      envelope = (await response.json()) as GraphQLResponseEnvelope<T>;
    } catch (caught) {
      throw new Error(
        `GraphQL response was not JSON: ${caught instanceof Error ? caught.message : String(caught)}`,
      );
    }
    if (!response.ok || envelope.errors?.length) {
      throw new Error(
        envelope.errors?.[0]?.message ?? response.statusText ?? "GraphQL request failed",
      );
    }
    if (envelope.data === undefined) {
      throw new Error("GraphQL response did not include data");
    }
    return envelope.data;
  };
  return {
    query: call,
    mutate: call,
  };
}
