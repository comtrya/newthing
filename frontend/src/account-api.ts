// Typed client for `/api/account/*` routes. Today only Git PATs are
// covered; SSH keys and session management land alongside the SSH
// transport (#219, #207 tarpc).

export interface GitPersonalAccessToken {
  id: string;
  ownerPrincipalUri: string;
  name: string;
  tokenPrefix: string;
  scopes: string[];
  expiresAt: number | null;
  createdAt: number;
  lastUsedAt: number | null;
  revokedAt: number | null;
}

export interface CreateGitTokenInput {
  name: string;
  scopes: string[];
  expiresInDays?: number;
}

export interface CreateGitTokenResult {
  /** One-shot plaintext token — shown to the user exactly once. */
  token: string;
  record: GitPersonalAccessToken;
}

const BASE = "/api/account/git-tokens";

async function readJson<T>(response: Response, fallback: string): Promise<T> {
  const envelope = (await response.json().catch(() => null)) as
    | { errors?: Array<{ message?: string; extensions?: { code?: string } }>; [key: string]: unknown }
    | null;
  if (!response.ok || envelope?.errors?.length) {
    const message = envelope?.errors?.[0]?.message ?? fallback;
    throw new Error(message);
  }
  return envelope as T;
}

export async function listGitPersonalAccessTokens(): Promise<GitPersonalAccessToken[]> {
  const response = await fetch(BASE, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  const body = await readJson<{ personalAccessTokens: GitPersonalAccessToken[] }>(
    response,
    `failed to list Git tokens (${response.status})`,
  );
  return body.personalAccessTokens ?? [];
}

export async function createGitPersonalAccessToken(
  input: CreateGitTokenInput,
): Promise<CreateGitTokenResult> {
  const response = await fetch(BASE, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      name: input.name,
      scopes: input.scopes,
      ...(input.expiresInDays !== undefined ? { expiresInDays: input.expiresInDays } : {}),
    }),
  });
  const body = await readJson<{ token: string; personalAccessToken: GitPersonalAccessToken }>(
    response,
    `failed to create Git token (${response.status})`,
  );
  return { token: body.token, record: body.personalAccessToken };
}

export async function revokeGitPersonalAccessToken(id: string): Promise<boolean> {
  const response = await fetch(`${BASE}/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  const body = await readJson<{ revoked: boolean }>(
    response,
    `failed to revoke Git token (${response.status})`,
  );
  return body.revoked === true;
}
