export interface OidcProvider {
	id: string;
	loginUrl: string;
}

interface OidcProvidersResponse {
	providers?: Array<{
		id?: unknown;
		loginUrl?: unknown;
	}>;
}

export async function fetchOidcProviders(
	fetchImpl: typeof fetch = fetch,
): Promise<OidcProvider[]> {
	const response = await fetchImpl("/auth/oidc/providers", {
		credentials: "include",
		headers: { Accept: "application/json" },
	});
	if (!response.ok) {
		throw new Error(`OIDC providers request failed (${response.status})`);
	}
	const body = (await response.json()) as OidcProvidersResponse;
	return (body.providers ?? []).flatMap((provider) => {
		if (
			typeof provider.id !== "string" ||
			typeof provider.loginUrl !== "string" ||
			provider.id.length === 0 ||
			provider.loginUrl.length === 0
		) {
			return [];
		}
		return [{ id: provider.id, loginUrl: provider.loginUrl }];
	});
}
