/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const ok = <T>(data: T) => ({ ok: true as const, status: 200, data });
const err = (message: string) => ({ ok: false as const, status: 503, message });

const logistics = { createShipment: vi.fn() };
const organization = { getCustomers: vi.fn(), getShipments: vi.fn() };
const traceability = { getBatchList: vi.fn() };

vi.mock('$lib/Api/logistics.server', () => logistics);
vi.mock('$lib/Api/organization.server', () => organization);
vi.mock('$lib/Api/traceability.server', () => traceability);

const { load } = await import('./+page.server');

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
