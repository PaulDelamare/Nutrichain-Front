/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const ok = <T>(data: T) => ({ ok: true as const, status: 200, data });
const err = (status: number, message: string) => ({ ok: false as const, status, message });

const traceability = {
	getBatchList: vi.fn(),
	getGenealogy: vi.fn(),
	getRecallSimulation: vi.fn()
};

vi.mock('$lib/Api/traceability.server', () => traceability);

const { actions } = await import('./+page.server');

const shipment = {
	shipmentId: 'ship-1',
	shipmentRef: 'EXP-2026-0042',
	customerName: 'Supermarché Central',
	dateEnvoi: '2026-07-31T17:04:57.375Z',
	statutLivraison: 'LIVRE',
	dateLivraison: '2026-08-01T17:04:57.390Z',
	transporteur: 'TransFroid Express',
	batchIds: ['lot-2']
};

const simulation = {
	impactedCount: 4,
	impactedBatchIds: ['lot-1', 'lot-2', 'lot-3', 'lot-4'],
	impactedBatchIdsTruncated: false,
	affectedShipmentsCount: 1,
	affectedShipments: [shipment],
	affectedShipmentsTruncated: false,
	depthSaturated: false
};

const genealogy = {
	downstream: [
		{ id: 'lot-2', lot_number: '260801-9XVI3T', nom_produit: 'Beurre', statut: 'EN_STOCK' },
		{ id: 'lot-3', lot_number: '260801-0HX5TL', nom_produit: 'Beurre', statut: 'BLOQUE' },
		{ id: 'lot-4', lot_number: '260801-19BJCD', nom_produit: 'Beurre', statut: 'BLOQUE' }
	]
};

const submit = (lotId = 'lot-1') =>
	(actions as any).default({
		request: { formData: async () => new Map([['lotId', lotId]]) },
		fetch: vi.fn(),
		cookies: {}
	});

beforeEach(() => {
	vi.clearAllMocks();
	traceability.getRecallSimulation.mockResolvedValue(ok(simulation));
	traceability.getGenealogy.mockResolvedValue(ok(genealogy));
});

describe('simulation de rappel', () => {
	/**
	 * #79 — La 4e étape du parcours qualité. L'écran s'arrêtait à un compteur de lots : voir les
	 * magasins touchés exigeait de déclencher un rappel RÉEL et irréversible, sur une page qui
	 * annonce « Lecture seule ».
	 */
	it('remonte les magasins touchés, sans rien déclencher', async () => {
		const result = await submit();

		expect(result.affectedShipments).toEqual([shipment]);
		expect(traceability.getRecallSimulation).toHaveBeenCalledWith(
			expect.anything(),
			expect.anything(),
			'lot-1'
		);
	});

	/**
	 * L'écran dérivait le compte de la généalogie (`downstream.length + 1`), une lecture plafonnée à
	 * 1000 lots : au-delà, il annonçait 1001 là où le rappel en bloque des dizaines de milliers. Les
	 * deux valeurs diffèrent ici volontairement — sinon l'assertion serait vraie quel que soit le calcul.
	 */
	it('prend le compte de lots de l’API, sans le recalculer depuis la généalogie', async () => {
		traceability.getRecallSimulation.mockResolvedValue(ok({ ...simulation, impactedCount: 9 }));

		const result = await submit();

		expect(result.impactedCount).toBe(9);
		expect(result.downstream).toHaveLength(3);
	});

	/**
	 * La généalogie est plafonnée à 1000 lots côté API. Sans ce drapeau, l'écart entre le compte
	 * exact et la liste affichée passerait pour une incohérence de l'application.
	 */
	it('signale une liste de lots plus courte que le compte réel', async () => {
		traceability.getRecallSimulation.mockResolvedValue(ok({ ...simulation, impactedCount: 1200 }));

		const result = await submit();

		expect(result.downstreamPartial).toBe(true);
	});

	it('ne signale aucune troncature quand la liste est complète', async () => {
		const result = await submit();

		expect(result.downstreamPartial).toBe(false);
	});

	it("échoue avec le statut de l'API quand la simulation est refusée", async () => {
		traceability.getRecallSimulation.mockResolvedValue(err(404, 'Lot source introuvable.'));

		const result = await submit();

		expect(result.status).toBe(404);
		expect(result.data.message).toBe('Lot source introuvable.');
	});

	/**
	 * La généalogie n'est qu'un confort d'affichage : son échec ne doit pas emporter le chiffre
	 * d'impact, qui est la raison d'être de l'écran.
	 */
	it('rend quand même l’impact si la généalogie échoue', async () => {
		traceability.getGenealogy.mockResolvedValue(err(503, 'API indisponible'));

		const result = await submit();

		expect(result.impactedCount).toBe(4);
		expect(result.downstream).toEqual([]);
	});

	it('refuse une soumission sans lot', async () => {
		const result = await submit('');

		expect(result.status).toBe(400);
		expect(traceability.getRecallSimulation).not.toHaveBeenCalled();
	});
});
