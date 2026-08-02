/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const ok = <T>(data: T) => ({ ok: true as const, status: 200, data });
const err = (message: string) => ({ ok: false as const, status: 503, message });

const logistics = { createShipment: vi.fn(), confirmShipmentDelivery: vi.fn() };
const organization = { getCustomers: vi.fn(), getShipments: vi.fn() };
const traceability = { getBatchList: vi.fn() };

vi.mock('$lib/Api/logistics.server', () => logistics);
vi.mock('$lib/Api/organization.server', () => organization);
vi.mock('$lib/Api/traceability.server', () => traceability);

const { load, actions } = await import('./+page.server');

const run = (query = '') =>
	(load as any)({
		fetch: vi.fn(),
		cookies: {},
		url: new URL(`http://front.test/expeditions${query}`)
	});

/** Les options réellement envoyées à l'API lors du dernier chargement. */
const requete = () => organization.getShipments.mock.calls.at(-1)?.[2];

const shipmentPage = (rows: unknown[] = []) =>
	ok({ data: rows, pagination: { page: 1, limit: 25, total: rows.length, totalPages: 1 } });

/**
 * Ce que l'API renvoie à un rôle TERRAIN : `{ id, nom_enseigne, adresse_livraison }`. L'adresse est
 * une donnée d'exploitation (elle pré-remplit la destination), mais `is_active` reste absent — les
 * archivés sont déjà écartés par le `where` du serveur.
 */
const fieldCustomer = {
	id: 'c1',
	nom_enseigne: 'Épicerie du Marché',
	adresse_livraison: '3 rue des Halles'
};

beforeEach(() => {
	organization.getShipments.mockResolvedValue(shipmentPage([]));
	organization.getCustomers.mockResolvedValue(ok([fieldCustomer]));
	traceability.getBatchList.mockResolvedValue(
		ok([
			{
				id: 'l1',
				lot_number: '260727-SO4BEW',
				statut: 'EN_STOCK',
				quantite_actuelle: '400',
				unite_code: 'KG',
				produit: { nom: 'Beurre' }
			}
		])
	);
});

describe('chargement des expéditions', () => {
	/**
	 * #82 — Même défaut que sur les réceptions : `customers.data.filter((c) => c.is_active)` vidait
	 * le sélecteur Client pour tout rôle terrain, sur une liste déjà filtrée côté API.
	 */
	it('propose les clients servis à un rôle terrain, sans is_active (#82)', async () => {
		const data = await run();

		expect(data.customers).toEqual([fieldCustomer]);
	});

	it('ne propose que les lots réellement expédiables', async () => {
		traceability.getBatchList.mockResolvedValue(
			ok([
				{
					id: 'l1',
					lot_number: 'A',
					statut: 'EN_STOCK',
					quantite_actuelle: '1',
					unite_code: 'KG',
					produit: { nom: 'Beurre' }
				},
				{
					id: 'l2',
					lot_number: 'B',
					statut: 'BLOQUE',
					quantite_actuelle: '1',
					unite_code: 'KG',
					produit: { nom: 'Beurre' }
				}
			])
		);

		const data = await run();

		expect(data.lots.map((l: { id: string }) => l.id)).toEqual(['l1']);
	});

	it('signale l’erreur et n’affiche aucun formulaire pré-rempli quand l’API refuse', async () => {
		organization.getShipments.mockResolvedValue(err('API injoignable'));

		const data = await run();

		expect(data.error).toBe('API injoignable');
		expect(data.customers).toEqual([]);
	});

	// Les filtres de colonnes partent à l'API (filtrage sur toute l'organisation), au lieu d'être
	// appliqués sur la seule page reçue côté front.
	it('transmet les filtres de colonnes et la page à l’API', async () => {
		await run('?page=2&ref=BL&client=c1&statut=LIVRE&date=2026-07-31');

		expect(requete()).toMatchObject({
			page: 2,
			ref: 'BL',
			client: 'c1',
			statut: 'LIVRE',
			date: '2026-07-31'
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
});

describe('confirmation de livraison', () => {
	const buildRequest = (id: string) =>
		({ formData: async () => new Map([['id', id]]) }) as unknown as Request;

	const runConfirm = (id: string, role: string) =>
		(actions as any).confirm({
			request: buildRequest(id),
			fetch: vi.fn(),
			cookies: {},
			locals: { user: { role } }
		});

	beforeEach(() => {
		// Sans ce nettoyage, l'appel du cas precedent fuit et « n'a pas appele l'API » passe alors
		// que la garde a saute.
		logistics.confirmShipmentDelivery.mockReset();
		logistics.confirmShipmentDelivery.mockResolvedValue(
			ok({
				id: 'e1',
				shipment_id: 'BL-1',
				date_livraison: '2026-07-31T10:00:00.000Z',
				lots_livres: 2
			})
		);
	});

	it('constate l’arrivée et rend la date retenue', async () => {
		const res = await runConfirm('e1', 'operator');

		expect(logistics.confirmShipmentDelivery).toHaveBeenCalledWith(
			expect.anything(),
			expect.anything(),
			'e1'
		);
		// La date est assertée, et pas seulement la référence : sans ça, la transmettre à `undefined`
		// laissait tout vert et l'écran annonçait « arrivée le Invalid Date ».
		expect(res).toMatchObject({ confirmed: { ref: 'BL-1' } });
		expect(res.confirmed.date).toContain('31/07/2026');
		expect(res.confirmed.date).not.toContain('T10:00:00');
	});

	/**
	 * La garde d'écriture est doublée côté serveur front : l'API refuse aussi, mais laisser partir
	 * la requête afficherait un échec réseau là où il s'agit d'un droit manquant.
	 */
	it('refuse un rôle en lecture seule sans appeler l’API', async () => {
		const res = await runConfirm('e1', 'viewer');

		expect(res.status).toBe(403);
		// La CLÉ compte autant que le code : le gabarit ne lit que `confirmError`. Sous `createError`,
		// le refus part dans le vide et l'utilisateur voit un clic sans effet.
		expect(res.data).toMatchObject({ confirmError: expect.any(String) });
		expect(logistics.confirmShipmentDelivery).not.toHaveBeenCalled();
	});

	it('refuse une expédition non désignée', async () => {
		const res = await runConfirm('', 'operator');

		expect(res.status).toBe(400);
		expect(res.data).toMatchObject({ confirmError: expect.any(String) });
		expect(logistics.confirmShipmentDelivery).not.toHaveBeenCalled();
	});

	it('relaie le refus de l’API au lieu de le taire', async () => {
		logistics.confirmShipmentDelivery.mockResolvedValue(err('Expédition introuvable'));

		const res = await runConfirm('e1', 'operator');

		expect(res.status).toBe(503);
		expect(res.data).toMatchObject({ confirmError: 'Expédition introuvable' });
	});
});

describe('lecture de l’arrivée', () => {
	it('distingue une arrivée constatée d’une arrivée inconnue', async () => {
		organization.getShipments.mockResolvedValue(
			shipmentPage([
				{
					id: 'e1',
					shipment_id: 'BL-1',
					statut_livraison: 'LIVRE',
					date_livraison: '2026-07-31T10:00:00.000Z',
					date_envoi: '2026-07-30T08:00:00.000Z',
					liaisons: []
				},
				{
					id: 'e2',
					shipment_id: 'BL-2',
					statut_livraison: 'EN_ROUTE',
					date_livraison: null,
					date_envoi: '2026-07-30T08:00:00.000Z',
					liaisons: []
				}
			])
		);

		const data = await run();

		expect(data.shipments[0].deliveredAt).not.toBeNull();
		// `null` et non une chaîne vide : c'est ce que l'écran teste pour proposer la confirmation.
		expect(data.shipments[1].deliveredAt).toBeNull();
	});
});
