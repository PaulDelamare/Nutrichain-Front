import { describe, it, expect, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({ env: { API_URL: 'http://api.test' } }));

const { getPublicScan } = await import('./public.server');

function fetchQuiRepond(corps: unknown, status = 200) {
	const appels: string[] = [];
	const fetch = (async (url: string) => {
		appels.push(String(url));
		return new Response(typeof corps === 'string' ? corps : JSON.stringify(corps), {
			status,
			headers: { 'content-type': 'application/json' }
		});
	}) as unknown as typeof globalThis.fetch;
	return { fetch, appels };
}

describe('getPublicScan', () => {
	it('interroge la route publique en encodant l’identifiant scanné', async () => {
		const { fetch, appels } = fetchQuiRepond({ data: {} });
		await getPublicScan(fetch, '01/03701234500012/10/lot 1');
		expect(appels[0]).toBe('http://api.test/api/public/scan/01%2F03701234500012%2F10%2Flot%201');
	});

	it('rend la fiche consommateur telle que l’API la publie', async () => {
		const { fetch } = fetchQuiRepond({ data: { lot: { nom_produit: 'Lait 1L' } } });
		const res = await getPublicScan(fetch, 'lot-1');
		expect(res).toMatchObject({ ok: true, data: { lot: { nom_produit: 'Lait 1L' } } });
	});

	it('détaille l’erreur de validation renvoyée par l’API', async () => {
		const { fetch } = fetchQuiRepond({ error: [{ message: 'Code GS1 invalide.' }] }, 400);
		const res = await getPublicScan(fetch, 'xx');
		expect(res).toEqual({ ok: false, status: 400, message: 'Code GS1 invalide.' });
	});

	it('reprend le message de l’API à défaut de détail par champ', async () => {
		const { fetch } = fetchQuiRepond({ message: 'Ce lot a été rappelé.' }, 410);
		const res = await getPublicScan(fetch, 'lot-1');
		expect(res).toMatchObject({ status: 410, message: 'Ce lot a été rappelé.' });
	});

	// Un consommateur qui scanne un QR ne doit jamais tomber sur une page vide sans explication.
	it('affiche « Lot introuvable. » quand l’API ne dit rien de plus', async () => {
		const { fetch } = fetchQuiRepond({}, 404);
		const res = await getPublicScan(fetch, 'lot-1');
		expect(res).toMatchObject({ status: 404, message: 'Lot introuvable.' });
	});

	it('survit à une réponse non-JSON', async () => {
		const { fetch } = fetchQuiRepond('<html>oups</html>', 500);
		const res = await getPublicScan(fetch, 'lot-1');
		expect(res.ok).toBe(false);
	});

	it('annonce un service indisponible quand l’API ne répond pas', async () => {
		const fetch = (async () => {
			throw new Error('ECONNREFUSED');
		}) as unknown as typeof globalThis.fetch;

		const res = await getPublicScan(fetch, 'lot-1');
		expect(res).toEqual({
			ok: false,
			status: 503,
			message: 'Service indisponible — réessayez plus tard.'
		});
	});
});
