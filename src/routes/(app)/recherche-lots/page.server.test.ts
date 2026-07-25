/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const ok = <T>(data: T) => ({ ok: true as const, status: 200, data });
const err = (message: string) => ({ ok: false as const, status: 503, message });

const getBatches = vi.fn();
const getEquipment = vi.fn();

vi.mock('$lib/Api/traceability.server', () => ({
	getBatches: (...a: unknown[]) => getBatches(...a)
}));

vi.mock('$lib/Api/organization.server', () => ({
	getEquipment: (...a: unknown[]) => getEquipment(...a)
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
		pagination: { page: 1, limit: 50, total: rows.length, totalPages: 1, ...pagination }
	});

/** Les paramètres réellement envoyés à l'API lors du dernier chargement. */
const requete = () => getBatches.mock.calls.at(-1)?.[2];

beforeEach(() => {
	getBatches.mockReset();
	getBatches.mockResolvedValue(batchPage([]));
	getEquipment.mockResolvedValue(ok([]));
});

describe('chargement de la recherche de lots', () => {
	/**
	 * ⚠️ Le cœur de l'issue #32. Sans `page`, l'API ne sert que ses 100 lots les plus récents :
	 * un lot plus ancien restait introuvable, et l'écran affirmait qu'il n'existait pas.
	 */
	it('demande à l’API la page réclamée par l’URL', async () => {
		await run('?page=4');

		expect(requete()).toMatchObject({ page: 4, limit: 50 });
	});

	it('délègue la recherche à l’API plutôt que de filtrer les lignes reçues', async () => {
		await run('?q=260711-000201');

		expect(requete()).toMatchObject({ search: '260711-000201' });
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
		getBatches.mockResolvedValue(batchPage([], { page: 3, total: 342, totalPages: 7 }));

		const data = await run('?page=3');

		expect(data.pagination).toEqual({ page: 3, limit: 50, total: 342, totalPages: 7 });
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
