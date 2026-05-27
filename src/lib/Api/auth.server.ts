import type { Cookies } from '@sveltejs/kit';
import { api, applySetCookies, type ApiResult } from './client.server';

export type MePayload = {
	user: {
		id: string;
		name: string;
		email: string;
	};
	session: Record<string, unknown>;
	activeOrgId?: string;
};

export async function signIn(
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	email: string,
	password: string
): Promise<ApiResult<unknown>> {
	const client = api(fetch, cookies);
	const res = await client.post('/api/auth/sign-in/email', { email, password });

	if (res.ok) {
		applySetCookies(res.response, cookies);
	}

	return res;
}

export async function signOut(fetch: typeof globalThis.fetch, cookies: Cookies) {
	const client = api(fetch, cookies);
	const res = await client.post('/api/auth/sign-out');

	for (const c of cookies.getAll()) {
		if (c.name.includes('better-auth') || c.name.includes('session')) {
			cookies.delete(c.name, { path: '/' });
		}
	}

	return res;
}

export async function getMe(
	fetch: typeof globalThis.fetch,
	cookies: Cookies
): Promise<ApiResult<MePayload>> {
	return api(fetch, cookies).get<MePayload>('/api/me');
}
