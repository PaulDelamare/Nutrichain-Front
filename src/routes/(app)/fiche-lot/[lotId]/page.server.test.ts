/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const ok = <T>(data: T) => ({ ok: true as const, status: 200, data });

const getBatchById = vi.fn();
const getGenealogy = vi.fn();
const getMovements = vi.fn();
const getAuditLogs = vi.fn();
const getBatchList = vi.fn();

vi.mock('$lib/Api/logistics.server', () => ({
	getBatchById: (...a: unknown[]) => getBatchById(...a),
	releaseQuarantine: vi.fn()
}));

vi.mock('$lib/Api/organization.server', () => ({
	getMovements: (...a: unknown[]) => getMovements(...a),
	getAuditLogs: (...a: unknown[]) => getAuditLogs(...a)
}));

vi.mock('$lib/Api/traceability.server', () => ({
	getGenealogy: (...a: unknown[]) => getGenealogy(...a),
	getBatchList: (...a: unknown[]) => getBatchList(...a),
	triggerRecall: vi.fn()
}));

const { load } = await import('./+page.server');

const run = (lotId = 'lot-1') => (load as any)({ fetch: vi.fn(), cookies: {}, params: { lotId } });

beforeEach(() => {
	vi.clearAllMocks();
	getGenealogy.mockResolvedValue(ok({ origines: [] }));
	getMovements.mockResolvedValue(ok([]));
	getAuditLogs.mockResolvedValue(ok([]));
	getBatchList.mockResolvedValue(ok([]));
});

describe('chargement de la fiche lot — historique', () => {
	/**
	 * ⚠️ Cœur de #30. `getBatchById` joint déjà les mouvements avec leur motif. Les recharger
	 * via `getMovements` pour y mettre `metadata: null` vidait la frise après une levée.
	 */
	it('conserve les mouvements (et leur motif) déjà joints par getBatchById', async () => {
		getBatchById.mockResolvedValue(
			ok({
				id: 'lot-1',
				lot_number: 'L1',
				statut: 'EN_STOCK',
				quantite_actuelle: '100',
				unite_code: 'KG',
				date_peremption: null,
				mouvements: [
					{
						id: 1,
						type_action: 'LEVEE_QUARANTAINE',
						quantite: 100,
						unite: 'KG',
						created_at: '2026-07-12T11:00:00.000Z',
						metadata: { motif: '2e contrôle conforme' }
					}
				]
			})
		);

		const data = await run();

		expect(getMovements).not.toHaveBeenCalled();
		expect(data.sheet.events).toHaveLength(1);
		expect(data.sheet.events[0].title).toBe('Levée de quarantaine');
		expect(data.sheet.events[0].detail).toContain('Motif : 2e contrôle conforme');
	});

	it('retombe sur getMovements quand le lot n’embarque aucun mouvement', async () => {
		getBatchById.mockResolvedValue(
			ok({
				id: 'lot-1',
				lot_number: 'L1',
				statut: 'BLOQUE',
				quantite_actuelle: '100',
				unite_code: 'KG',
				date_peremption: null,
				mouvements: []
			})
		);
		getMovements.mockResolvedValue(
			ok([
				{
					id: 2,
					type_action: 'QUARANTAINE_FROID',
					quantite: 100,
					unite: 'KG',
					created_at: '2026-07-12T09:00:00.000Z',
					metadata: { peakTemp: 9.2, threshold: 4, sensorId: 'CAP-01' }
				}
			])
		);

		const data = await run();

		expect(getMovements).toHaveBeenCalled();
		expect(data.sheet.events[0].detail).toContain('Pic 9.2 °C');
	});

	it('n’appelle pas l’audit quand des mouvements existent déjà', async () => {
		getBatchById.mockResolvedValue(
			ok({
				id: 'lot-1',
				lot_number: 'L1',
				statut: 'EN_STOCK',
				quantite_actuelle: '1',
				unite_code: 'KG',
				date_peremption: null,
				mouvements: [
					{
						id: 1,
						type_action: 'RECEPTION',
						quantite: 1,
						unite: 'KG',
						created_at: '2026-07-11T08:00:00.000Z'
					}
				]
			})
		);

		await run();

		expect(getAuditLogs).not.toHaveBeenCalled();
	});
});
