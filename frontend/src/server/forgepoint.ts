const DEFAULT_BACKEND_URL = "http://127.0.0.1:8080";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

const FORWARDED_HEADERS = [
  "accept",
  "authorization",
  "content-type",
  "git-protocol",
  "if-none-match",
  "range",
  "sec-fetch-mode",
];

export function backendUrl(pathname: string): URL {
  const base = process.env.FORGEPOINT_SERVER_URL ?? DEFAULT_BACKEND_URL;
  return new URL(pathname, base.endsWith("/") ? base : `${base}/`);
}

export async function proxyForgepoint(request: Request, pathname: string): Promise<Response> {
  let upstream: Response;
  let targetHref = "";
  try {
    const source = new URL(request.url);
    const target = backendUrl(`${pathname}${source.search}`);
    targetHref = target.href;
    const headers = new Headers();
    for (const key of FORWARDED_HEADERS) {
      const value = request.headers.get(key);
      if (value && !HOP_BY_HOP_HEADERS.has(key)) {
        headers.set(key, value);
      }
    }

    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
      duplex: "half",
    } as RequestInit);
  } catch (error) {
    const cause =
      error instanceof Error && "cause" in error && error.cause
        ? ` (${String(error.cause)})`
        : "";
    return jsonError(
      502,
      "UPSTREAM_UNAVAILABLE",
      `${targetHref || "Forgepoint server"}: ${
        error instanceof Error ? error.message : "Forgepoint server request failed"
      }${cause}`,
    );
  }

  const headers = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

export function jsonError(status: number, code: string, message: string): Response {
  return new Response(
    JSON.stringify({
      errors: [{ message, extensions: { code } }],
    }),
    {
      status,
      headers: { "content-type": "application/json" },
    },
  );
}
