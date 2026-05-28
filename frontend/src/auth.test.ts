import { describe, expect, test } from "bun:test";

import { fetchOidcProviders } from "./auth";

describe("OIDC auth helpers", () => {
	test("loads configured login URLs from the server", async () => {
		const fetchImpl = (async (url: string, init: RequestInit) => {
			expect(url).toBe("/auth/oidc/providers");
			expect(init.credentials).toBe("include");
			return new Response(
				JSON.stringify({
					providers: [{ id: "rawkode", loginUrl: "/auth/oidc/rawkode/login" }],
				}),
				{ status: 200 },
			);
		}) as unknown as typeof fetch;

		await expect(fetchOidcProviders(fetchImpl)).resolves.toEqual([
			{ id: "rawkode", loginUrl: "/auth/oidc/rawkode/login" },
		]);
	});

	test("ignores malformed providers", async () => {
		const fetchImpl = (async () =>
			new Response(
				JSON.stringify({
					providers: [
						{ id: "rawkode", loginUrl: "/auth/oidc/rawkode/login" },
						{ id: "", loginUrl: "/auth/oidc/empty/login" },
						{ id: "missing-url" },
					],
				}),
				{ status: 200 },
			)) as unknown as typeof fetch;

		await expect(fetchOidcProviders(fetchImpl)).resolves.toEqual([
			{ id: "rawkode", loginUrl: "/auth/oidc/rawkode/login" },
		]);
	});
});
