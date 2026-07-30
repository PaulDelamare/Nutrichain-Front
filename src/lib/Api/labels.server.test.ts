import { describe, it, expect, vi } from 'vitest';
import type { Cookies } from '@sveltejs/kit';

vi.mock('$env/dynamic/private', () => ({
	env: { API_URL: 'http://api.test', API_KEY: 'cle-de-test' }
}));

const { fetchEquipmentLabel } = await import('./organization.server');
const { fetchBatchLabel, fetchLogisticUnitLabel } = await import('./logistics.server');

const cookies = {
	getAll: () => [{ name: 'better-auth.session_token', value: 'jeton' }]
} as Cookies;

function fetchImage(status = 200) {
	const appels: { url: string; init?: RequestInit }[] = [];
	const fetch = (async (url: string, init?: RequestInit) => {
		appels.push({ url: String(url), init });
		return new Response(status === 200 ? new Uint8Array([0x89, 0x50]) : null, { status });
	}) as unknown as typeof globalThis.fetch;
	return { fetch, appels };
}

const fetchInjoignable = (async () => {
	throw new Error('ECONNREFUSED');
}) as unknown as typeof globalThis.fetch;

// Ces deux téléchargements contournent l'enveloppe JSON du client : l'étiquette est un PNG.
describe.each([
	[
		'fetchEquipmentLabel',
		(fetch: typeof globalThis.fetch) => fetchEquipmentLabel(fetch, cookies, 'frigo/1'),
		'http://api.test/api/organization/equipment/frigo%2F1/label'
	],
	[
		'fetchBatchLabel',
		(fetch: typeof globalThis.fetch) => fetchBatchLabel(fetch, cookies, 'lot/1'),
		'http://api.test/api/logistics/batches/lot%2F1/label'
	],
	[
		'fetchLogisticUnitLabel',
		(fetch: typeof globalThis.fetch) => fetchLogisticUnitLabel(fetch, cookies, 'palette/1'),
		'http://api.test/api/logistics/logistic-units/palette%2F1/label'
	]
])('%s', (_nom, telecharger, urlAttendue) => {
	it('demande un PNG à la bonne route, identifiant encodé', async () => {
		const { fetch, appels } = fetchImage();
		await telecharger(fetch);

		expect(appels[0].url).toBe(urlAttendue);
		const entetes = new Headers(appels[0].init?.headers);
		expect(entetes.get('Accept')).toBe('image/png');
		expect(entetes.get('Cookie')).toBe('better-auth.session_token=jeton');
	});

	it('rend le binaire de l’étiquette quand l’API répond', async () => {
		const { fetch } = fetchImage();
		const res = await telecharger(fetch);
		expect(res).toMatchObject({ ok: true });
		expect(res.ok && res.buffer.byteLength).toBe(2);
	});

	it('distingue une étiquette absente d’une panne de génération', async () => {
		const res404 = await telecharger(fetchImage(404).fetch);
		expect(res404).toEqual({ ok: false, message: 'Étiquette introuvable.' });

		const res500 = await telecharger(fetchImage(500).fetch);
		expect(res500).toEqual({ ok: false, message: 'Téléchargement impossible.' });
	});

	it('signale une API injoignable au lieu de laisser échouer le téléchargement', async () => {
		const res = await telecharger(fetchInjoignable);
		expect(res).toEqual({ ok: false, message: 'API injoignable.' });
	});
});
