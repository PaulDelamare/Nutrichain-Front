// ! IMPORTS
import { env } from '$env/dynamic/private';
import { getMe } from '$lib/Api/auth.server';
import type { Handle, HandleFetch } from '@sveltejs/kit';

export const handle = (async ({ event, resolve }) => {
	try {
		const me = await getMe(event.fetch, event.cookies);

		if (me.ok) {
			event.locals.user = {
				id: me.data.user.id,
				name: me.data.user.name,
				email: me.data.user.email
			};
		} else {
			event.locals.user = undefined;
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

		const cookie = event.cookies
			.getAll()
			.map((c) => `${c.name}=${c.value}`)
			.join('; ');

		if (cookie) request.headers.set('Cookie', cookie);
	}

	return fetch(request);
}) satisfies HandleFetch;
