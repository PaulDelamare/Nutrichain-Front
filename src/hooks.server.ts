// ! IMPORTS
import { env } from '$env/dynamic/private';
import AuthApi from '$lib/Api/auth.server';
import type { Handle, HandleFetch } from '@sveltejs/kit';

const ACCESS_TOKEN_MAX_AGE = 15 * 60;
const secureCookie = env.SITE_URL?.startsWith('https://') ?? env.NODE_ENV === 'production';
const unauthorizedStatuses = new Set([401, 403]);


export const handle = (async ({ event, resolve }) => {

	const jwt = event.cookies.get('accessToken');
	if (!jwt) {
		event.locals.user = undefined;
		return await resolve(event);
	}

	if (!event.locals.user) {
		const api = new AuthApi(event.fetch);
		const setAccessTokenCookie = (token: string) => {
			event.cookies.set('accessToken', token, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: secureCookie,
				maxAge: ACCESS_TOKEN_MAX_AGE
			});
		};

		const setRefreshTokenCookie = (token: string) => {
			event.cookies.set('refreshToken', token, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: secureCookie,
				maxAge: 30 * 24 * 60 * 60
			});
		};

		const loadUser = async () => {
			const profile = await api.getInfo();

			if ('data' in profile && profile.data && profile.status >= 200 && profile.status < 300) {
				return profile.data;
			}

			if (profile.status && unauthorizedStatuses.has(profile.status)) {
				const refreshed = await api.refresh();
				if ('data' in refreshed && refreshed.data) {
					const { accessToken, refreshToken, user } = refreshed.data;
					if (accessToken) {
						setAccessTokenCookie(accessToken);
					}
					if (refreshToken) {
						setRefreshTokenCookie(refreshToken);
					}
					return user;
				}
			}

			return null;
		};

		try {
			const user = await loadUser();

			if (!user) {
				event.cookies.delete('accessToken', { path: '/' });
				event.locals.user = undefined;
			} else {
				event.locals.user = user;
			}
		} catch (err) {
			console.error('Erreur lors de la récupération de l\'utilisateur', err);
			event.cookies.delete('accessToken', { path: '/' });
			event.cookies.delete('refreshToken', { path: '/' });
			event.locals.user = undefined;
		}
	}

	return await resolve(event);
}) satisfies Handle;


export const handleFetch = (async ({ request, fetch }) => {
	if (request.url.startsWith(env.VITE_API_URL!)) {
		request.headers.set('x-api-key', env.VITE_API_KEY!);
	}

	return fetch(request);
}) satisfies HandleFetch;
