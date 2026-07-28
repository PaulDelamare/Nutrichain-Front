/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const ok = <T>(data: T) => ({ ok: true as const, status: 200, data });
const err = (message: string) => ({ ok: false as const, status: 503, message });

const logistics = { getReceipts: vi.fn(), createReceipt: vi.fn() };
const organization = {
	getSuppliers: vi.fn(),
	getProductsForConfig: vi.fn(),
	getEquipment: vi.fn()
};

vi.mock('$lib/Api/logistics.server', () => logistics);
vi.mock('$lib/Api/organization.server', () => organization);

const { load } = await import('./+page.server');

const run = () => (load as any)({ fetch: vi.fn(), cookies: {} });

const pageReceptions = (rows: unknown[] = []) =>
	ok({ data: rows, pagination: { page: 1, limit: 20, total: rows.length, totalPages: 1 } });

/**
 * Ce que l'API renvoie à un rôle TERRAIN (`operator`, `quality`, `viewer`).
 *
 * `organization.service.ts` restreint la projection hors `PERSONAL_DATA_ROLES` :
 * `select: { id: true, nom_ferme: true }`. Ni `is_active`, ni l'adresse du siège — le filtrage des
 * archivés est déjà fait côté serveur, dans le `where`.
 */
const fournisseurTerrain = { id: 'f1', nom_ferme: 'Ferme Bio de Paris' };

beforeEach(() => {
	logistics.getReceipts.mockResolvedValue(pageReceptions());
	organization.getSuppliers.mockResolvedValue(ok([fournisseurTerrain]));
	organization.getProductsForConfig.mockResolvedValue(
		ok([{ id: 'p1', nom: 'Lait cru', is_active: true }])
	);
	organization.getEquipment.mockResolvedValue(ok([{ id: 'm1', nom: 'Rack', statut: 'OK' }]));
});

describe('chargement des réceptions', () => {
	/**
	 * #82 — Le front refiltrait `suppliers.data.filter((s) => s.is_active)` sur une liste que l'API
	 * a DÉJÀ filtrée, en lisant un champ qu'elle ne lui envoie pas : `undefined` étant faux, le
	 * sélecteur Fournisseur était vide et l'écran inutilisable pour tout rôle terrain.
	 *
	 * Le défaut ne se voyait pas en démonstration : le seed connecte un `owner`, qui reçoit la
	 * projection complète — donc `is_active`, donc une liste pleine.
	 */
	it('propose les fournisseurs servis à un rôle terrain, sans is_active (#82)', async () => {
		const data = await run();

		expect(data.suppliers).toEqual([fournisseurTerrain]);
	});

	it('propose aussi les produits et le matériel utilisable', async () => {
		const data = await run();

		expect(data.products).toHaveLength(1);
		expect(data.equipment).toHaveLength(1);
	});

	// Le matériel hors service, lui, N'est pas filtré par l'API : ce tri-là est une règle métier du
	// front, pas une redondance — on ne propose pas de ranger un lot dans un frigo en panne.
	it('écarte le matériel hors service', async () => {
		organization.getEquipment.mockResolvedValue(
			ok([
				{ id: 'm1', nom: 'Rack', statut: 'OK' },
				{ id: 'm2', nom: 'Frigo en panne', statut: 'HORS_SERVICE' }
			])
		);

		const data = await run();

		expect(data.equipment.map((e: { id: string }) => e.id)).toEqual(['m1']);
	});

	it('signale l’erreur et n’affiche aucun formulaire pré-rempli quand l’API refuse', async () => {
		logistics.getReceipts.mockResolvedValue(err('API injoignable'));

		const data = await run();

		expect(data.error).toBe('API injoignable');
		expect(data.suppliers).toEqual([]);
	});
});
