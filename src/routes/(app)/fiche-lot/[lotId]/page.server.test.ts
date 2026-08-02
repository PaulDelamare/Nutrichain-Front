/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const ok = <T>(data: T) => ({ ok: true as const, status: 200, data });
const err = (message: string) => ({ ok: false as const, status: 409, message });

const scrapBatch = vi.fn();
const getBatchById = vi.fn();
const getGenealogy = vi.fn();
const getMovements = vi.fn();
const getAuditLogs = vi.fn();
const getBatchList = vi.fn();
const getShelfWithdrawals = vi.fn();
const recordShelfWithdrawal = vi.fn();

vi.mock('$lib/Api/logistics.server', () => ({
	getBatchById: (...a: unknown[]) => getBatchById(...a),
	releaseQuarantine: vi.fn(),
	scrapBatch: (...a: unknown[]) => scrapBatch(...a),
	getShelfWithdrawals: (...a: unknown[]) => getShelfWithdrawals(...a),
	recordShelfWithdrawal: (...a: unknown[]) => recordShelfWithdrawal(...a)
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

const { load, actions } = await import('./+page.server');

const run = (lotId = 'lot-1') => (load as any)({ fetch: vi.fn(), cookies: {}, params: { lotId } });

beforeEach(() => {
	vi.clearAllMocks();
	getGenealogy.mockResolvedValue(ok({ origines: [] }));
	getMovements.mockResolvedValue(ok([]));
	getAuditLogs.mockResolvedValue(ok([]));
	getBatchList.mockResolvedValue(ok([]));
	getShelfWithdrawals.mockResolvedValue(ok({ batchId: 'lot-1', clients: [] }));
	recordShelfWithdrawal.mockResolvedValue(
		ok({ id: 'r-1', quantiteLivree: '40', quantiteRetiree: '10', resteARetirer: '30', unite: 'KG' })
	);
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

/**
 * #254 — Mettre au rebut est la SEULE sortie d'un lot bloqué : la levée de quarantaine et un
 * contrôle conforme rendent tous deux 409. L'API l'exposait, aucune interface ne l'appelait, donc
 * un lot bloqué par erreur restait coincé à vie.
 */
describe('mise au rebut', () => {
	const buildRequest = (motif: string) =>
		({ formData: async () => new Map([['motif', motif]]) }) as unknown as Request;

	const runScrap = (motif: string, role: string) =>
		(actions as any).scrap({
			request: buildRequest(motif),
			fetch: vi.fn(),
			cookies: {},
			params: { lotId: 'lot-1' },
			locals: { user: { role } }
		});

	beforeEach(() => {
		scrapBatch.mockReset();
		scrapBatch.mockResolvedValue(ok({ id: 'lot-1', statut: 'REBUT' }));
	});

	it('met le lot au rebut avec son motif', async () => {
		const res = await runScrap('Rupture de chaine du froid de 4 h', 'quality');

		expect(scrapBatch).toHaveBeenCalledWith(
			expect.anything(),
			expect.anything(),
			'lot-1',
			'Rupture de chaine du froid de 4 h'
		);
		expect(res).toMatchObject({ scrapped: true });
	});

	/**
	 * Détruire de la marchandise n'est pas de la manutention : l'API exige les rôles qualité. La
	 * garde est doublée ici pour ne pas aller chercher un 403 sur le réseau.
	 */
	it("refuse la mise au rebut à l'opérateur, sans appeler l'API", async () => {
		const res = await runScrap('Motif valable', 'operator');

		expect(res.status).toBe(403);
		// La CLÉ compte autant que le code : le gabarit ne lit que `scrapError`.
		expect(res.data).toMatchObject({ scrapError: expect.any(String) });
		expect(scrapBatch).not.toHaveBeenCalled();
	});

	it('refuse un motif trop court — la destruction est scellée dans l’audit', async () => {
		const res = await runScrap('ok', 'quality');

		expect(res.status).toBe(400);
		expect(res.data).toMatchObject({ scrapError: expect.any(String) });
		expect(scrapBatch).not.toHaveBeenCalled();
	});

	it('relaie le refus de l’API au lieu de le taire', async () => {
		scrapBatch.mockResolvedValue(
			err('Seul un lot en quarantaine ou sous rappel peut etre mis au rebut.')
		);

		const res = await runScrap('Motif valable', 'quality');

		expect(res.status).toBe(409);
		expect(res.data).toMatchObject({
			scrapError: 'Seul un lot en quarantaine ou sous rappel peut etre mis au rebut.'
		});
	});
});

describe('retrait en magasin', () => {
	const soumettre = (
		role: string,
		champs: Record<string, string> = {
			id_client: 'client-1',
			quantite: '10',
			motif: 'Retrait du rayon apres rappel'
		}
	) =>
		(actions as any).withdraw({
			request: { formData: async () => new Map(Object.entries(champs)) },
			fetch: vi.fn(),
			cookies: {},
			params: { lotId: 'lot-1' },
			locals: { user: { role } }
		});

	/**
	 * La garde est volontairement PLUS large que la décision qualité : un retrait est un fait
	 * rapporté par un magasin, pas une décision. Refuser l'opérateur ici bloquerait celui qui prend
	 * l'appel, alors que l'API l'accepte.
	 */
	it("autorise l'opérateur comme le rôle qualité", async () => {
		await soumettre('operator');
		await soumettre('quality');

		expect(recordShelfWithdrawal).toHaveBeenCalledTimes(2);
	});

	it('refuse le rôle en lecture seule', async () => {
		const resultat = await soumettre('viewer');

		expect(resultat.status).toBe(403);
		expect(recordShelfWithdrawal).not.toHaveBeenCalled();
	});

	it("n'envoie pas d'unité : elle est reprise du lot côté API", async () => {
		await soumettre('operator', {
			id_client: 'client-1',
			quantite: '10',
			motif: 'Retrait du rayon apres rappel',
			unite: 'G'
		});

		expect(recordShelfWithdrawal.mock.calls[0][3]).not.toHaveProperty('unite');
	});

	it('refuse une quantité nulle, négative ou absente', async () => {
		const zero = await soumettre('operator', {
			id_client: 'c-1',
			quantite: '0',
			motif: 'Motif suffisant'
		});
		const negative = await soumettre('operator', {
			id_client: 'c-1',
			quantite: '-5',
			motif: 'Motif suffisant'
		});

		expect(zero.status).toBe(400);
		expect(negative.status).toBe(400);
		expect(recordShelfWithdrawal).not.toHaveBeenCalled();
	});

	it('remonte le refus de l’API sans le traduire', async () => {
		recordShelfWithdrawal.mockResolvedValue(err('Retrait supérieur à ce qui a été livré'));

		const resultat = await soumettre('quality');

		expect(resultat.status).toBe(409);
		expect(resultat.data.withdrawError).toBe('Retrait supérieur à ce qui a été livré');
	});

	it("charge l'avancement par magasin avec la fiche", async () => {
		getShelfWithdrawals.mockResolvedValue(
			ok({
				batchId: 'lot-1',
				clients: [{ customerId: 'c-1', customerName: 'Super U', resteARetirer: '30' }]
			})
		);

		const resultat = await run();

		expect(resultat.magasins).toHaveLength(1);
	});

	/**
	 * Le panneau est un confort : son indisponibilité ne doit pas priver l'utilisateur de la fiche,
	 * qui porte le statut du lot et son historique.
	 */
	it('rend la fiche même si l’avancement est refusé', async () => {
		getShelfWithdrawals.mockResolvedValue({ ok: false, status: 403, message: 'refus' });

		const resultat = await run();

		expect(resultat.sheet).toBeDefined();
		expect(resultat.magasins).toEqual([]);
	});
});
