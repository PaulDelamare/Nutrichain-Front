/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const ok = <T>(data: T) => ({ ok: true as const, status: 200, data });
const err = (message: string) => ({ ok: false as const, status: 503, message });

const getAlerts = vi.fn();
const getQualityControls = vi.fn();
const getQuarantineBatches = vi.fn();
const getMovements = vi.fn();
const getBatches = vi.fn();

vi.mock('$lib/Api/organization.server', () => ({
	getAlerts: (...a: unknown[]) => getAlerts(...a),
	getQualityControls: (...a: unknown[]) => getQualityControls(...a),
	getQuarantineBatches: (...a: unknown[]) => getQuarantineBatches(...a),
	getMovements: (...a: unknown[]) => getMovements(...a)
}));

vi.mock('$lib/Api/traceability.server', () => ({
	getBatches: (...a: unknown[]) => getBatches(...a),
	MAX_BATCH_PAGE_SIZE: 500
}));

const { load } = await import('./+page.server');

const run = () => (load as any)({ fetch: vi.fn(), cookies: {} });

/** Réponse paginée de `GET /traceability/batches` : `total` compte tout, `data` la page reçue. */
const batchPage = (rows: unknown[], total = rows.length) =>
	ok({
		data: rows,
		pagination: { page: 1, limit: 500, total, totalPages: Math.ceil(total / 500) }
	});

/** Une page pleine sur un catalogue bien plus grand : le cas que le plafond de l'API rendait muet. */
const pageTronquee = batchPage(
	Array.from({ length: 500 }, () => ({ statut: 'EN_STOCK' })),
	1200
);

beforeEach(() => {
	getBatches.mockResolvedValue(batchPage([]));
	getAlerts.mockResolvedValue(ok([]));
	getQualityControls.mockResolvedValue(ok([]));
	getQuarantineBatches.mockResolvedValue(ok([]));
	getMovements.mockResolvedValue(ok([]));
});

describe('chargement du tableau de bord', () => {
	it('signale l’erreur quand les contrôles qualité échouent — sinon la page affirmerait « 0 anomalie »', async () => {
		getQualityControls.mockResolvedValue(err('403 interdit'));

		const data = await run();

		expect(data.error).toBe('403 interdit');
	});

	it('signale l’erreur quand les mouvements échouent', async () => {
		getMovements.mockResolvedValue(err('API injoignable'));

		const data = await run();

		expect(data.error).toBe('API injoignable');
	});

	it('ne compte pas les contrôles conformes dans les anomalies ouvertes', async () => {
		getQualityControls.mockResolvedValue(
			ok([
				{ id: '1', type_test: 'T', resultat: 'CONFORME', date_test: '', lot: { id: 'l' } },
				{ id: '2', type_test: 'T', resultat: 'NON_CONFORME', date_test: '', lot: { id: 'l' } }
			])
		);

		const data = await run();

		const anomalies = data.kpis.find((k: { label: string }) => k.label === 'Anomalies ouvertes');
		expect(anomalies?.value).toBe('1');
	});

	it('ne signale aucune erreur quand tous les appels réussissent', async () => {
		const data = await run();

		expect(data.error).toBeUndefined();
	});

	/**
	 * ⚠️ Le KPI comptait les lots de la page reçue, plafonnée par l'API : une organisation qui en
	 * suivait 342 lisait « 100 ». Le total vient désormais de la pagination.
	 */
	it('annonce le total du catalogue, pas les lots de la page reçue', async () => {
		getBatches.mockResolvedValue(pageTronquee);

		const data = await run();

		const lots = data.kpis.find((k: { label: string }) => k.label === 'Lots suivis');
		expect(lots?.value).toBe('1200');
	});

	it('demande le plafond de volumétrie plutôt que les 100 lots par défaut', async () => {
		await run();

		expect(getBatches).toHaveBeenCalledWith(expect.anything(), expect.anything(), { limit: 500 });
	});

	it('dit sur quelle part du catalogue porte la répartition quand elle est tronquée', async () => {
		getBatches.mockResolvedValue(pageTronquee);

		const data = await run();

		expect(data.lotStatusSubtitle).toBe('Par statut — 500 lots les plus récents sur 1200');
	});

	it('ne relativise pas la répartition quand elle couvre tout le catalogue', async () => {
		getBatches.mockResolvedValue(batchPage([{ statut: 'EN_STOCK' }, { statut: 'BLOQUE' }], 2));

		const data = await run();

		expect(data.lotStatusSubtitle).toBe('Par statut opérationnel');
	});
});
