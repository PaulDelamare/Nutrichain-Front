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

const run = () => (load as any)({ fetch: vi.fn(), cookies: {} });

/**
 * Ce que l'API renvoie à un rôle TERRAIN : `{ id, nom_enseigne, adresse_livraison }`. L'adresse est
 * une donnée d'exploitation (elle pré-remplit la destination), mais `is_active` reste absent — les
 * archivés sont déjà écartés par le `where` du serveur.
 */
const clientTerrain = {
	id: 'c1',
	nom_enseigne: 'Épicerie du Marché',
	adresse_livraison: '3 rue des Halles'
};

beforeEach(() => {
	organization.getShipments.mockResolvedValue(ok([]));
	organization.getCustomers.mockResolvedValue(ok([clientTerrain]));
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

		expect(data.customers).toEqual([clientTerrain]);
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
});

describe('confirmation de livraison', () => {
	const requete = (id: string) =>
		({ formData: async () => new Map([['id', id]]) }) as unknown as Request;

	const executer = (id: string, role: string) =>
		(actions as any).confirmer({
			request: requete(id),
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
		const res = await executer('e1', 'operator');

		expect(logistics.confirmShipmentDelivery).toHaveBeenCalledWith(
			expect.anything(),
			expect.anything(),
			'e1'
		);
		expect(res).toMatchObject({ confirmed: { ref: 'BL-1' } });
	});

	/**
	 * La garde d'écriture est doublée côté serveur front : l'API refuse aussi, mais laisser partir
	 * la requête afficherait un échec réseau là où il s'agit d'un droit manquant.
	 */
	it('refuse un rôle en lecture seule sans appeler l’API', async () => {
		const res = await executer('e1', 'viewer');

		expect(res.status).toBe(403);
		expect(logistics.confirmShipmentDelivery).not.toHaveBeenCalled();
	});

	it('refuse une expédition non désignée', async () => {
		const res = await executer('', 'operator');

		expect(res.status).toBe(400);
		expect(logistics.confirmShipmentDelivery).not.toHaveBeenCalled();
	});

	it('relaie le refus de l’API au lieu de le taire', async () => {
		logistics.confirmShipmentDelivery.mockResolvedValue(err('Expédition introuvable'));

		const res = await executer('e1', 'operator');

		expect(res.status).toBe(503);
		expect(res.data).toMatchObject({ confirmError: 'Expédition introuvable' });
	});
});

describe('lecture de l’arrivée', () => {
	it('distingue une arrivée constatée d’une arrivée inconnue', async () => {
		organization.getShipments.mockResolvedValue(
			ok([
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

		expect(data.shipments[0].dateLivraison).not.toBeNull();
		// `null` et non une chaîne vide : c'est ce que l'écran teste pour proposer la confirmation.
		expect(data.shipments[1].dateLivraison).toBeNull();
	});
});
