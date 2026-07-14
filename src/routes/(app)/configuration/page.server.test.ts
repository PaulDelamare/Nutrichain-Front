import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isHttpError } from '@sveltejs/kit';

const api = {
	getSuppliers: vi.fn(),
	getLocations: vi.fn(),
	getCustomers: vi.fn(),
	getProductsForConfig: vi.fn(),
	getEquipment: vi.fn(),
	createSupplier: vi.fn(),
	setSupplierActive: vi.fn(),
	createLocation: vi.fn(),
	setLocationActive: vi.fn(),
	createCustomer: vi.fn(),
	setCustomerActive: vi.fn(),
	createProduct: vi.fn(),
	setProductActive: vi.fn(),
	createEquipment: vi.fn()
};

vi.mock('$lib/Api/organization.server', () => api);

const mod = await import('./+page.server');

const user = (isAdmin: boolean) => ({
	id: 'u',
	name: 'N',
	email: 'e@x.fr',
	role: isAdmin ? 'admin' : 'operator',
	isPlatformAdmin: false
});

const form = (entries: Record<string, string>) => ({
	request: { formData: async () => ({ get: (k: string) => entries[k] ?? null }) },
	fetch: vi.fn(),
	cookies: {}
});

const statutLoad = async (fn: (e: unknown) => Promise<unknown>, e: unknown) => {
	try {
		await fn(e);
		return 200;
	} catch (err) {
		return isHttpError(err) ? err.status : 'exception';
	}
};

const statutAction = async (
	fn: (e: unknown) => Promise<{ status?: number } | undefined>,
	e: unknown
) => {
	const res = await fn(e);
	return res?.status ?? 200;
};

beforeEach(() => {
	Object.values(api).forEach((m) => m.mockReset());
	api.getSuppliers.mockResolvedValue({ ok: true, data: [] });
	api.getLocations.mockResolvedValue({ ok: true, data: [] });
	api.getCustomers.mockResolvedValue({ ok: true, data: [] });
	api.getProductsForConfig.mockResolvedValue({ ok: true, data: [] });
	api.getEquipment.mockResolvedValue({ ok: true, data: [] });
	api.createSupplier.mockResolvedValue({ ok: true, data: { id: 's' } });
	api.createLocation.mockResolvedValue({ ok: true, data: { id: 'l' } });
	api.createCustomer.mockResolvedValue({ ok: true, data: { id: 'c' } });
	api.createProduct.mockResolvedValue({ ok: true, data: { id: 'p' } });
});

describe('configuration — réservée aux administrateurs', () => {
	it('refuse le load à un non-admin', async () => {
		const load = (mod as any).load;
		expect(await statutLoad(load, { ...form({}), locals: { user: user(false) } })).toBe(403);
	});

	it("refuse l'action createSupplier à un non-admin", async () => {
		const s = await statutAction((mod as any).actions.createSupplier, {
			...form({ nom_ferme: 'X', adresse_siege: 'Y' }),
			locals: { user: user(false) }
		});
		expect(s).toBe(403);
		expect(api.createSupplier).not.toHaveBeenCalled();
	});

	it("refuse l'action createLocation à un non-admin", async () => {
		const s = await statutAction((mod as any).actions.createLocation, {
			...form({ nom: 'Quai', type: 'RECEPTION' }),
			locals: { user: user(false) }
		});
		expect(s).toBe(403);
		expect(api.createLocation).not.toHaveBeenCalled();
	});

	it('refuse les actions createCustomer et createProduct à un non-admin', async () => {
		const c = await statutAction((mod as any).actions.createCustomer, {
			...form({ nom_enseigne: 'X', adresse_livraison: 'Y' }),
			locals: { user: user(false) }
		});
		const p = await statutAction((mod as any).actions.createProduct, {
			...form({
				nom: 'X',
				code_gtin: '12345678',
				categorie: 'C',
				unite_reference: 'KG',
				duree_conservation_defaut: '30',
				seuil_alerte_stock: '5'
			}),
			locals: { user: user(false) }
		});
		expect(c).toBe(403);
		expect(p).toBe(403);
		expect(api.createCustomer).not.toHaveBeenCalled();
		expect(api.createProduct).not.toHaveBeenCalled();
	});

	it('laisse un admin créer un client et un produit', async () => {
		const c = await (mod as any).actions.createCustomer({
			...form({ nom_enseigne: 'Super U', adresse_livraison: '1 rue' }),
			locals: { user: user(true) }
		});
		const p = await (mod as any).actions.createProduct({
			...form({
				nom: 'Yaourt',
				code_gtin: '3456789012345',
				categorie: 'Frais',
				unite_reference: 'KG',
				duree_conservation_defaut: '30',
				seuil_alerte_stock: '10'
			}),
			locals: { user: user(true) }
		});
		expect(c).toMatchObject({ customerCreated: { id: 'c' } });
		expect(p).toMatchObject({ productCreated: { id: 'p' } });
	});

	it('refuse un GTIN mal formé côté serveur avant l’appel API', async () => {
		const res = await (mod as any).actions.createProduct({
			...form({
				nom: 'X',
				code_gtin: 'ABC',
				categorie: 'Frais',
				unite_reference: 'KG',
				duree_conservation_defaut: '30',
				seuil_alerte_stock: '10'
			}),
			locals: { user: user(true) }
		});
		expect(res).toMatchObject({ status: 400 });
		expect(api.createProduct).not.toHaveBeenCalled();
	});

	it('laisse un admin créer un fournisseur', async () => {
		const res = await (mod as any).actions.createSupplier({
			...form({ nom_ferme: 'Ferme Bio', adresse_siege: '1 rue' }),
			locals: { user: user(true) }
		});
		expect(api.createSupplier).toHaveBeenCalledOnce();
		expect(res).toMatchObject({ supplierCreated: { id: 's' } });
	});

	it('valide les champs requis avant d’appeler l’API', async () => {
		const res = await (mod as any).actions.createLocation({
			...form({ nom: 'A', type: '' }),
			locals: { user: user(true) }
		});
		expect(res).toMatchObject({ status: 400 });
		expect(api.createLocation).not.toHaveBeenCalled();
	});
});
