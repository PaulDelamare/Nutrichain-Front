// ! IMPORTS
import { env } from '$env/dynamic/private';
import {
	getMe,
	hasAuthSessionCookie,
	deleteSessionCookies,
	type MePayload
} from '$lib/Api/auth.server';
import { estRole, type KnownRole } from '$lib/config/roles';
import type { Handle, HandleFetch } from '@sveltejs/kit';

let rbacEteintSignale = false;

function lireRole(data: MePayload): KnownRole {
	if (!('role' in data)) {
		if (!rbacEteintSignale) {
			rbacEteintSignale = true;
			console.warn(
				"[RBAC] /api/me ne renvoie pas `role` : l'API est antérieure à cette fonctionnalité. " +
					"Le cloisonnement d'interface est DÉSACTIVÉ (seul le 403 de l'API protège encore)."
			);
		}
		return undefined;
	}

	return estRole(data.role) ? data.role : null;
}

let plateformeInconnueSignalee = false;

function lireAdminPlateforme(data: MePayload): boolean {
	if (!('isPlatformAdmin' in data) && !plateformeInconnueSignalee) {
		plateformeInconnueSignalee = true;
		console.warn(
			"[Plateforme] /api/me ne renvoie pas `isPlatformAdmin` : l'API est antérieure. Un admin " +
				'de plateforme serait traité comme un membre et ne verrait pas sa console.'
		);
	}

	return data.isPlatformAdmin === true;
}

export const handle = (async ({ event, resolve }) => {
	if (!hasAuthSessionCookie(event.cookies)) {
		event.locals.user = undefined;
		return resolve(event);
	}

	try {
		const me = await getMe(event.fetch, event.cookies);

		if (me.ok) {
			event.locals.user = {
				id: me.data.user.id,
				name: me.data.user.name,
				email: me.data.user.email,
				role: lireRole(me.data),
				isPlatformAdmin: lireAdminPlateforme(me.data),
				twoFactorEnabled: Boolean(me.data.user.twoFactorEnabled)
			};
		} else {
			event.locals.user = undefined;

			if (me.status === 401) {
				deleteSessionCookies(event.cookies);
			}
		}
	} catch (err) {
		console.error('Session API indisponible', err);
		event.locals.user = undefined;
	}

	return resolve(event);
}) satisfies Handle;

export const handleFetch = (async ({ request, fetch, event }) => {
	const apiBase = (env.API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

	if (request.url.startsWith(apiBase)) {
		const isLogistics = request.url.includes('/api/logistics/');

		if (!isLogistics && env.API_KEY) {
			request.headers.set('x-api-key', env.API_KEY);
		}

		// `cookies.getAll()` décode la valeur (cf. `client.server.ts#buildCookieHeader`) : sans
		// ré-encodage, ce hook écrase le Cookie header déjà correctement construit par `ApiClient`
		// avec une version non ré-encodée, et l'API (Better-Auth) refuse le cookie relayé.
		const cookie = event.cookies
			.getAll()
			.map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
			.join('; ');

		if (cookie) request.headers.set('Cookie', cookie);
	}

	return fetch(request);
}) satisfies HandleFetch;
