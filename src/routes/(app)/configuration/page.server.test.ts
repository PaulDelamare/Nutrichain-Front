import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isHttpError } from '@sveltejs/kit';

const api = {
	getSuppliers: vi.fn(),
	getLocations: vi.fn(),
	getCustomers: vi.fn(),
	getProductsForConfig: vi.fn(),
	createSupplier: vi.fn(),
	setSupplierActive: vi.fn(),
	createLocation: vi.fn(),
	setLocationActive: vi.fn(),
	createCustomer: vi.fn(),
	setCustomerActive: vi.fn(),
	createProduct: vi.fn(),
	setProductActive: vi.fn(),
	getEquipment: vi.fn(),
	createEquipment: vi.fn()
};

const connectors = {
	importProductsCsv: vi.fn(),
	importCustomersCsv: vi.fn()
};

vi.mock('$lib/Api/organization.server', () => api);
vi.mock('$lib/Api/connectors.server', () => connectors);

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

// Le load LÈVE (error 403). Les actions RENVOIENT un fail() (objet { status }), pour ne pas
// naviguer en pleine page et jeter la saisie — même contrat que /utilisateurs et /audit-logs.
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
	api.createSupplier.mockResolvedValue({ ok: true, data: { id: 's' } });
	api.createLocation.mockResolvedValue({ ok: true, data: { id: 'l' } });
	api.createCustomer.mockResolvedValue({ ok: true, data: { id: 'c' } });
	api.createProduct.mockResolvedValue({ ok: true, data: { id: 'p' } });
	api.getEquipment.mockResolvedValue({ ok: true, data: [] });
	api.createEquipment.mockResolvedValue({ ok: true, data: { id: 'eq' } });
	connectors.importProductsCsv.mockReset();
	connectors.importCustomersCsv.mockReset();
	const report = { total: 1, created: 1, updated: 0, errors: 0, results: [] };
	connectors.importProductsCsv.mockResolvedValue({ ok: true, data: report });
	connectors.importCustomersCsv.mockResolvedValue({ ok: true, data: report });
});

// La requête d'import porte un fichier : formData().get('file') renvoie un File réel.
const formWithFile = (csv: string | null) => ({
	request: {
		formData: async () => ({
			get: (k: string) =>
				k === 'file' && csv !== null ? new File([csv], 'x.csv', { type: 'text/csv' }) : null
		})
	},
	fetch: vi.fn(),
	cookies: {}
});

describe('configuration — réservée aux administrateurs', () => {
	// Le garde de layout ne couvre pas les actions : sans garde dans l'action, un operator
	// pourrait POSTer ?/createSupplier malgré la redirection.
	it('refuse le load à un non-admin', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const load = (mod as any).load;
		expect(await statutLoad(load, { ...form({}), locals: { user: user(false) } })).toBe(403);
	});

	it("refuse l'action createSupplier à un non-admin", async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const s = await statutAction((mod as any).actions.createSupplier, {
			...form({ nom_ferme: 'X', adresse_siege: 'Y' }),
			locals: { user: user(false) }
		});
		expect(s).toBe(403);
		expect(api.createSupplier).not.toHaveBeenCalled();
	});

	it("refuse l'action createLocation à un non-admin", async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const s = await statutAction((mod as any).actions.createLocation, {
			...form({ nom: 'Quai', type: 'RECEPTION' }),
			locals: { user: user(false) }
		});
		expect(s).toBe(403);
		expect(api.createLocation).not.toHaveBeenCalled();
	});

	it('refuse les actions createCustomer et createProduct à un non-admin', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const c = await statutAction((mod as any).actions.createCustomer, {
			...form({ nom_enseigne: 'X', adresse_livraison: 'Y' }),
			locals: { user: user(false) }
		});
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const c = await (mod as any).actions.createCustomer({
			...form({ nom_enseigne: 'Super U', adresse_livraison: '1 rue' }),
			locals: { user: user(true) }
		});
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const res = await (mod as any).actions.createSupplier({
			...form({ nom_ferme: 'Ferme Bio', adresse_siege: '1 rue' }),
			locals: { user: user(true) }
		});
		expect(api.createSupplier).toHaveBeenCalledOnce();
		expect(res).toMatchObject({ supplierCreated: { id: 's' } });
	});

	it('valide les champs requis avant d’appeler l’API', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const res = await (mod as any).actions.createLocation({
			...form({ nom: 'A', type: '' }),
			locals: { user: user(true) }
		});
		expect(res).toMatchObject({ status: 400 });
		expect(api.createLocation).not.toHaveBeenCalled();
	});

	it("refuse l'action createEquipment à un non-admin", async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const s = await statutAction((mod as any).actions.createEquipment, {
			...form({ nom: 'Frigo A', type: 'FRIGO', id_lieu: 'loc-1' }),
			locals: { user: user(false) }
		});
		expect(s).toBe(403);
		expect(api.createEquipment).not.toHaveBeenCalled();
	});

	it('refuse un type de matériel hors référentiel avant l’appel API', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const res = await (mod as any).actions.createEquipment({
			...form({ nom: 'Machine', type: 'ROBOT', id_lieu: 'loc-1' }),
			locals: { user: user(true) }
		});
		expect(res).toMatchObject({ status: 400 });
		expect(api.createEquipment).not.toHaveBeenCalled();
	});

	it('refuse un matériel sans emplacement avant l’appel API', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const res = await (mod as any).actions.createEquipment({
			...form({ nom: 'Frigo A', type: 'FRIGO', id_lieu: '' }),
			locals: { user: user(true) }
		});
		expect(res).toMatchObject({ status: 400 });
		expect(api.createEquipment).not.toHaveBeenCalled();
	});

	it("refuse l'import CSV à un non-admin, sans appeler l'API", async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const s = await statutAction((mod as any).actions.importProducts, {
			...formWithFile('nom,code_gtin\nYaourt,3456789012345'),
			locals: { user: user(false) }
		});
		expect(s).toBe(403);
		expect(connectors.importProductsCsv).not.toHaveBeenCalled();
	});

	it('refuse un import sans fichier (400) avant l’appel API', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const res = await (mod as any).actions.importCustomers({
			...formWithFile(null),
			locals: { user: user(true) }
		});
		expect(res).toMatchObject({ status: 400 });
		expect(connectors.importCustomersCsv).not.toHaveBeenCalled();
	});

	it('laisse un admin importer un CSV et renvoie le rapport routé par type', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const res = await (mod as any).actions.importProducts({
			...formWithFile(
				'nom,code_gtin,categorie,duree_conservation_defaut,seuil_alerte_stock,unite_reference\nYaourt,3456789012345,Frais,30,5,KG'
			),
			locals: { user: user(true) }
		});
		expect(connectors.importProductsCsv).toHaveBeenCalledOnce();
		expect(res).toMatchObject({
			importKind: 'products',
			importReport: { created: 1, total: 1 }
		});
	});

	it('laisse un admin créer un matériel (seuil optionnel omis si vide)', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const res = await (mod as any).actions.createEquipment({
			...form({ nom: 'Frigo A', type: 'FRIGO', id_lieu: 'loc-1', temp_seuil_max: '' }),
			locals: { user: user(true) }
		});
		expect(api.createEquipment).toHaveBeenCalledOnce();
		const [, , body] = api.createEquipment.mock.calls[0];
		expect(body).not.toHaveProperty('temp_seuil_max');
		expect(res).toMatchObject({ equipmentCreated: { id: 'eq' } });
	});
});
