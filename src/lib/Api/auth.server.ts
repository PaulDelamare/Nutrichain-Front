import type { Cookies } from '@sveltejs/kit';
import { api, applySetCookies, type ApiResult } from './client.server';
import type { Role } from '$lib/config/roles';

export type MePayload = {
	user: {
		id: string;
		name: string;
		email: string;
		twoFactorEnabled?: boolean;
	};
	session: Record<string, unknown>;
	activeOrgId?: string;
	role?: Role | null;
	isPlatformAdmin?: boolean;
};

/** Tout cookie posé par Better-Auth (session ET défi 2FA en attente). */
function isAuthCookieName(name: string): boolean {
	return name.includes('better-auth') || name.includes('session');
}

/**
 * Un cookie de SESSION Better-Auth, à distinguer du cookie `two_factor` (défi en attente, PAS une
 * session) : les deux contiennent tous deux `better-auth` dans leur nom. Les confondre a fait
 * disparaître le cookie 2FA en pleine connexion — `hooks.server.ts` le traitait comme une session
 * invalide et le supprimait avant même que l'écran de défi n'ait pu s'en servir.
 */
function isSessionCookieName(name: string): boolean {
	return isAuthCookieName(name) && !name.includes('two_factor');
}

/** Évite un appel /api/me inutile quand aucun cookie de session n'est présent. */
export function hasAuthSessionCookie(cookies: Cookies): boolean {
	return cookies.getAll().some((c) => isSessionCookieName(c.name));
}

/** Nettoyage d'une session invalide (401) : le défi 2FA en attente, lui, doit survivre. */
export function deleteSessionCookies(cookies: Cookies): void {
	for (const c of cookies.getAll()) {
		if (isSessionCookieName(c.name)) {
			cookies.delete(c.name, { path: '/' });
		}
	}
}

/** Déconnexion explicite : referme tout, y compris un défi 2FA resté en suspens. */
export function deleteAllAuthCookies(cookies: Cookies): void {
	for (const c of cookies.getAll()) {
		if (isAuthCookieName(c.name)) {
			cookies.delete(c.name, { path: '/' });
		}
	}
}

export type SignInResult = ApiResult<unknown> & { twoFactorRedirect?: boolean };

export async function signIn(
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	email: string,
	password: string
): Promise<SignInResult> {
	const client = api(fetch, cookies);
	const res = await client.post('/api/auth/sign-in/email', { email, password });

	if (res.ok) {
		// Le cookie posé ici EST le cookie `two_factor` quand la 2FA est requise : il n'y a pas de
		// session complète tant que `verifyTwoFactorTotp` n'a pas été appelé avec un code valide.
		applySetCookies(res.response, cookies);
		const raw = res.raw as { twoFactorRedirect?: boolean } | undefined;
		return { ...res, twoFactorRedirect: raw?.twoFactorRedirect === true };
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
	const res = await client.post('/api/auth/sign-up/email', { name, email, password, token });

	if (res.ok) {
		applySetCookies(res.response, cookies);
	}

	return res;
}

export async function signOut(fetch: typeof globalThis.fetch, cookies: Cookies) {
	const client = api(fetch, cookies);
	const res = await client.post('/api/auth/sign-out');

	deleteAllAuthCookies(cookies);

	return res;
}

export async function getMe(
	fetch: typeof globalThis.fetch,
	cookies: Cookies
): Promise<ApiResult<MePayload>> {
	return api(fetch, cookies).get<MePayload>('/api/me');
}

export type EnableTwoFactorPayload = { totpURI: string; backupCodes: string[] };

/** Démarre l'enrôlement TOTP : génère un secret (URI du QR code) et des codes de secours. */
export async function enableTwoFactor(
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	password: string
): Promise<ApiResult<unknown> & { payload?: EnableTwoFactorPayload }> {
	const res = await api(fetch, cookies).post('/api/auth/two-factor/enable', { password });
	return { ...res, payload: res.ok ? (res.raw as EnableTwoFactorPayload) : undefined };
}

/**
 * Confirme l'enrôlement OU termine une connexion bloquée par `twoFactorRedirect` — c'est le même
 * endpoint Better-Auth des deux côtés. Pose le cookie de session complète en cas de succès.
 */
export async function verifyTwoFactorTotp(
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	code: string
): Promise<ApiResult<unknown>> {
	const res = await api(fetch, cookies).post('/api/auth/two-factor/verify-totp', { code });

	if (res.ok) {
		applySetCookies(res.response, cookies);
	}

	return res;
}

/** Désactive la 2FA : redemande le mot de passe, comme l'enrôlement. */
export async function disableTwoFactor(
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	password: string
): Promise<ApiResult<unknown>> {
	return api(fetch, cookies).post('/api/auth/two-factor/disable', { password });
}
