import { describe, it, expect, vi } from 'vitest';
import type { Cookies } from '@sveltejs/kit';

vi.mock('$env/dynamic/private', () => ({
	env: { API_URL: 'http://api.test/', API_KEY: 'cle-de-test' }
}));

const { api } = await import('./client.server');

type Appel = { url: string; init?: RequestInit };

function fetchQuiRepond(
	corps: unknown,
	init: ResponseInit = { status: 200 }
): { fetch: typeof globalThis.fetch; appels: Appel[] } {
	const appels: Appel[] = [];
	const fetch = (async (url: string, requestInit?: RequestInit) => {
		appels.push({ url: String(url), init: requestInit });
		return new Response(typeof corps === 'string' ? corps : JSON.stringify(corps), {
			...init,
			headers: { 'content-type': 'application/json' }
		});
	}) as unknown as typeof globalThis.fetch;

	return { fetch, appels };
}

function fetchInjoignable(): typeof globalThis.fetch {
	return (async () => {
		throw new Error('ECONNREFUSED');
	}) as unknown as typeof globalThis.fetch;
}

function fakeCookies(entries: Record<string, string> = {}): Cookies {
	return {
		getAll: () => Object.entries(entries).map(([name, value]) => ({ name, value }))
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} as any;
}

const entetes = (appel: Appel) => new Headers(appel.init?.headers);

describe('ApiClient — construction de la requête', () => {
	it('préfixe le chemin par API_URL sans doubler le slash', async () => {
		const { fetch, appels } = fetchQuiRepond({ data: [] });
		await api(fetch).get('/api/organization/members');
		expect(appels[0].url).toBe('http://api.test/api/organization/members');
	});

	it('tolère un chemin sans slash initial', async () => {
		const { fetch, appels } = fetchQuiRepond({ data: [] });
		await api(fetch).get('api/organization/members');
		expect(appels[0].url).toBe('http://api.test/api/organization/members');
	});

	it('relaie les cookies de session à l’API', async () => {
		const { fetch, appels } = fetchQuiRepond({ data: [] });
		await api(fetch, fakeCookies({ 'better-auth.session_token': 'jeton' })).get('/x');
		expect(entetes(appels[0]).get('Cookie')).toBe('better-auth.session_token=jeton');
	});

	it('n’envoie pas d’en-tête Cookie vide quand il n’y a aucun cookie', async () => {
		const { fetch, appels } = fetchQuiRepond({ data: [] });
		await api(fetch, fakeCookies()).get('/x');
		expect(entetes(appels[0]).has('Cookie')).toBe(false);
	});

	it('joint la clé API par défaut', async () => {
		const { fetch, appels } = fetchQuiRepond({ data: [] });
		await api(fetch).get('/x');
		expect(entetes(appels[0]).get('x-api-key')).toBe('cle-de-test');
	});

	// Certaines routes engagent une personne (changement de rôle, contrôle qualité) : l'API doit
	// voir la session, pas une clé de service qui masquerait l'auteur réel.
	it('omet la clé API quand l’appelant exige une authentification par session', async () => {
		const { fetch, appels } = fetchQuiRepond({ data: [] });
		await api(fetch, undefined, { useApiKey: false }).get('/x');
		expect(entetes(appels[0]).has('x-api-key')).toBe(false);
	});
});

describe('ApiClient — lecture de la réponse', () => {
	it('déballe l’enveloppe { message, data } et conserve le corps brut', async () => {
		const { fetch } = fetchQuiRepond({ message: 'Liste des membres', data: [{ id: 'm1' }] });
		const res = await api(fetch).get<{ id: string }[]>('/x');

		expect(res).toMatchObject({ ok: true, status: 200, message: 'Liste des membres' });
		expect(res.ok && res.data).toEqual([{ id: 'm1' }]);
		// `raw` permet de lire un flag hors enveloppe (ex. `twoFactorRedirect` de Better-Auth).
		expect(res.ok && res.raw).toMatchObject({ message: 'Liste des membres' });
	});

	it('agrège les erreurs de validation champ par champ en un seul message', async () => {
		const { fetch } = fetchQuiRepond(
			{
				error: [
					{ field: 'nom', message: 'Nom requis.' },
					{ field: 'gtin', message: 'GTIN invalide.' }
				]
			},
			{ status: 422 }
		);
		const res = await api(fetch).get('/x');
		expect(res).toEqual({ ok: false, status: 422, message: 'Nom requis. GTIN invalide.' });
	});

	it('reprend le message de l’API quand il n’y a pas de détail par champ', async () => {
		const { fetch } = fetchQuiRepond({ message: 'Accès refusé.' }, { status: 403 });
		const res = await api(fetch).get('/x');
		expect(res).toMatchObject({ ok: false, status: 403, message: 'Accès refusé.' });
	});

	it('ne laisse jamais un échec sans message lisible', async () => {
		const { fetch } = fetchQuiRepond({}, { status: 500 });
		const res = await api(fetch).get('/x');
		expect(res).toMatchObject({ ok: false, message: 'Erreur API' });
	});

	it('signale une réponse non-JSON au lieu de lever', async () => {
		const { fetch } = fetchQuiRepond('<html>502 Bad Gateway</html>', { status: 502 });
		const res = await api(fetch).get('/x');
		expect(res.ok).toBe(false);
	});

	it('transforme une API injoignable en 503 explicite — pas en écran blanc', async () => {
		const res = await api(fetchInjoignable()).get('/x');
		expect(res).toEqual({
			ok: false,
			status: 503,
			message: 'API injoignable — réessayez plus tard.'
		});
	});
});

describe('ApiClient — écritures', () => {
	it('poste un corps JSON et rend la réponse brute (pour relayer les Set-Cookie)', async () => {
		const { fetch, appels } = fetchQuiRepond({ data: { id: 'l1' } }, { status: 201 });
		const res = await api(fetch).post('/api/x', { reason: 'Listeria' });

		expect(appels[0].init?.method).toBe('POST');
		expect(appels[0].init?.body).toBe('{"reason":"Listeria"}');
		expect(entetes(appels[0]).get('Content-Type')).toBe('application/json');
		expect(res.response).toBeInstanceOf(Response);
	});

	it('n’envoie pas de corps quand l’appelant n’en fournit pas', async () => {
		const { fetch, appels } = fetchQuiRepond({ data: null });
		await api(fetch).post('/api/x');
		expect(appels[0].init?.body).toBeUndefined();
	});

	it('utilise bien la méthode PATCH pour une mise à jour partielle', async () => {
		const { fetch, appels } = fetchQuiRepond({ data: null });
		await api(fetch).patch('/api/x', { active: false });
		expect(appels[0].init?.method).toBe('PATCH');
	});

	it('renvoie un 503 sans réponse HTTP quand l’écriture n’atteint pas l’API', async () => {
		const res = await api(fetchInjoignable()).post('/api/x', {});
		expect(res).toMatchObject({ ok: false, status: 503 });
		expect(res.response).toBeUndefined();
	});

	it('envoie un import CSV en text/csv, pas en JSON', async () => {
		const { fetch, appels } = fetchQuiRepond({ data: { total: 2 } });
		await api(fetch).postText('/api/connectors/imports/products', 'nom;gtin\nLait;123');

		expect(entetes(appels[0]).get('Content-Type')).toBe('text/csv');
		expect(appels[0].init?.body).toBe('nom;gtin\nLait;123');
	});

	it('signale une API injoignable pendant un import CSV', async () => {
		const res = await api(fetchInjoignable()).postText('/api/x', 'csv');
		expect(res).toMatchObject({ ok: false, status: 503 });
	});
});
