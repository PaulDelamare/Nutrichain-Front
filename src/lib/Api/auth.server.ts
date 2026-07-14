import type { Cookies } from '@sveltejs/kit';
import { api, applySetCookies, type ApiResult } from './client.server';
import type { Role } from '$lib/config/roles';

export type MePayload = {
	user: {
		id: string;
		name: string;
		email: string;
	};
	session: Record<string, unknown>;
	activeOrgId?: string;
	/**
	 * Absent si l'API est antérieure à l'exposition du rôle : ce n'est PAS la même chose que
	 * `null` (aucun rôle). Cf. `$lib/config/roles` — on ne masque rien tant qu'on ne sait pas.
	 */
	role?: Role | null;
};

/** Évite un appel /api/me inutile quand aucun cookie de session n'est présent. */
export function hasAuthSessionCookie(cookies: Cookies): boolean {
	return cookies.getAll().some((c) => c.name.includes('better-auth') || c.name.includes('session'));
}

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

export async function signUp(
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	name: string,
	email: string,
	password: string,
	token?: string
): Promise<ApiResult<unknown> & { response?: Response }> {
	const client = api(fetch, cookies);
	// token = invitation.id, exigé par le guard API dès qu'un utilisateur existe.
	const res = await client.post('/api/auth/sign-up/email', { name, email, password, token });

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
