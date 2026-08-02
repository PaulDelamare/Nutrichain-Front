/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const ok = <T>(data: T) => ({ ok: true as const, status: 200, data });
const err = (message: string) => ({ ok: false as const, status: 503, message });

const getBatches = vi.fn();
const getEquipment = vi.fn();
const getProducts = vi.fn();
const getLocations = vi.fn();

vi.mock('$lib/Api/traceability.server', () => ({
	getBatches: (...a: unknown[]) => getBatches(...a),
	getProducts: (...a: unknown[]) => getProducts(...a)
}));

vi.mock('$lib/Api/organization.server', () => ({
	getEquipment: (...a: unknown[]) => getEquipment(...a),
	getLocations: (...a: unknown[]) => getLocations(...a)
}));

const { load } = await import('./+page.server');

const run = (query = '') =>
	(load as any)({
		fetch: vi.fn(),
		cookies: {},
		url: new URL(`http://front.test/recherche-lots${query}`)
	});

const batchPage = (rows: unknown[], pagination: Record<string, number> = {}) =>
	ok({
		data: rows,
		pagination: { page: 1, limit: 25, total: rows.length, totalPages: 1, ...pagination }
	});

/** Les paramètres réellement envoyés à l'API lors du dernier chargement. */
const requete = () => getBatches.mock.calls.at(-1)?.[2];

beforeEach(() => {
	getBatches.mockReset();
	getBatches.mockResolvedValue(batchPage([]));
	getEquipment.mockResolvedValue(ok([]));
	getProducts.mockResolvedValue(ok([]));
	getLocations.mockResolvedValue(ok([]));
});

describe('chargement de la recherche de lots', () => {
	/**
	 * ⚠️ Le cœur de l'issue #32. Sans `page`, l'API ne sert que ses lots les plus récents :
	 * un lot plus ancien restait introuvable, et l'écran affirmait qu'il n'existait pas.
	 */
	it('demande à l’API la page réclamée par l’URL, taille par défaut 25', async () => {
		await run('?page=4');

		expect(requete()).toMatchObject({ page: 4, limit: 25 });
	});

	it('délègue la recherche à l’API plutôt que de filtrer les lignes reçues', async () => {
		await run('?q=260711-000201');

		expect(requete()).toMatchObject({ search: '260711-000201' });
	});

	/**
	 * ⚠️ Le cœur de ce lot : les filtres de colonnes partent à l'API (filtrage sur TOUTE
	 * l'organisation), au lieu d'être appliqués sur la seule page reçue côté front.
	 */
	it('transmet les filtres de colonnes à l’API', async () => {
		await run('?statut=BLOQUE&produit=p1&site=l1&lot=000201&gtin=3042');

		expect(requete()).toMatchObject({
			statut: 'BLOQUE',
			produit: 'p1',
			site: 'l1',
			lot: '000201',
			gtin: '3042'
		});
	});

	it('honore une taille de page de la liste (?limit=100)', async () => {
		const data = await run('?limit=100');

		expect(requete()).toMatchObject({ limit: 100 });
		expect(data.pageSize).toBe(100);
	});

	it('borne une taille de page hors liste au défaut (25)', async () => {
		const data = await run('?limit=999');

		expect(requete()).toMatchObject({ limit: 25 });
		expect(data.pageSize).toBe(25);
	});

	/** Un lien recopié de travers doit ouvrir la première page, pas une page d'erreur. */
	it.each(['?page=0', '?page=-2', '?page=abc', '?page=1.5', '?page='])(
		'retombe sur la première page pour %s',
		async (query) => {
			await run(query);

			expect(requete()).toMatchObject({ page: 1 });
		}
	);

	it('transmet la pagination de l’API à la page, total compris', async () => {
		getBatches.mockResolvedValue(batchPage([], { page: 3, limit: 25, total: 342, totalPages: 14 }));

		const data = await run('?page=3');

		expect(data.pagination).toEqual({ page: 3, limit: 25, total: 342, totalPages: 14 });
	});

	it('expose les options produit et lieu depuis l’API (couvrant toute l’organisation)', async () => {
		getProducts.mockResolvedValue(ok([{ id: 'p1', nom: 'Beurre', code_gtin: '3042' }]));
		getLocations.mockResolvedValue(ok([{ id: 'l1', nom: 'Quai de réception', is_active: true }]));

		const data = await run();

		expect(data.produitOptions).toEqual([{ label: 'Beurre', value: 'p1' }]);
		expect(data.siteOptions).toEqual([{ label: 'Quai de réception', value: 'l1' }]);
	});

	it('reste affichable quand l’API est injoignable, sans pagination fantôme', async () => {
		getBatches.mockResolvedValue(err('API injoignable'));

		const data = await run('?page=3');

		expect(data.error).toBe('API injoignable');
		expect(data.lots).toEqual([]);
		expect(data.pagination.totalPages).toBe(0);
	});

	it('n’envoie pas de recherche vide — l’API répondrait par un filtre inutile', async () => {
		await run('?q=%20%20');

		expect(requete()?.search).toBeUndefined();
	});
});
