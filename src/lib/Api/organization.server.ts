import type { Cookies } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { api } from './client.server';

export type ApiMember = {
	id: string;
	role: string;
	user: { id: string; email: string; name: string; twoFactorEnabled: boolean | null };
};

export type ApiAlert = {
	id: string;
	type: string;
	niveau_gravite: string;
	message: string;
	statut: string;
	id_materiel?: string | null;
	related_entity?: string | null;
	related_id?: string | null;
	created_at: string;
};

export type ApiAuditLog = {
	id: number;
	action: string;
	entity: string;
	entity_id: string;
	horodatage: string;
	id_user?: string | null;
	ancienne_valeur?: Record<string, unknown> | null;
	nouvelle_valeur?: Record<string, unknown> | null;
};

export type ApiQualityControl = {
	id: string;
	type_test: string;
	resultat: string;
	date_test: string;
	notes?: string | null;
	lot: { id: string; produit?: { nom: string } };
};

export type ApiEquipment = {
	id: string;
	nom: string;
	type: string;
	statut: string;
	sensor_id?: string | null;
	temp_actuelle: string | number | null;
	temp_seuil_max: string | number | null;
	lieu?: { nom: string };
};

export type ApiMovement = {
	id: number;
	type_action: string;
	quantite: string | number;
	unite: string;
	created_at: string;
	lot?: { id: string; produit?: { nom: string } };
	user?: { name: string } | null;
};

export type ApiSupplier = {
	id: string;
	nom_ferme: string;
	adresse_siege: string;
	type_produit?: string | null;
	contact_qualite?: string | null;
	is_active: boolean;
};

export type ApiLocation = {
	id: string;
	nom: string;
	type: string;
	description?: string | null;
	is_active: boolean;
};

export type ApiCustomer = {
	id: string;
	nom_enseigne: string;
	adresse_livraison: string;
	contact_urgence?: string | null;
	email?: string | null;
	notes?: string | null;
	is_active: boolean;
};

export type ApiShipment = {
	id: string;
	shipment_id: string;
	statut_livraison: string;
	date_envoi: string;
	client?: { nom_enseigne: string };
	liaisons?: { lot: { id: string } }[];
};

function orgApi(fetch: typeof globalThis.fetch, cookies: Cookies) {
	return api(fetch, cookies);
}

export const getMembers = (fetch: typeof globalThis.fetch, cookies: Cookies) =>
	orgApi(fetch, cookies).get<ApiMember[]>('/api/organization/members');

export const changeMemberRole = (
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	memberId: string,
	role: string
) =>
	api(fetch, cookies, { useApiKey: false }).patch(`/api/organization/members/${memberId}/role`, {
		role
	});

export const revokeMember = (fetch: typeof globalThis.fetch, cookies: Cookies, memberId: string) =>
	api(fetch, cookies, { useApiKey: false }).post(
		`/api/organization/members/${memberId}/revoke`,
		{}
	);

export const getAlerts = (fetch: typeof globalThis.fetch, cookies: Cookies) =>
	orgApi(fetch, cookies).get<ApiAlert[]>('/api/organization/alerts');

export const getAuditLogs = (fetch: typeof globalThis.fetch, cookies: Cookies, limit = 30) =>
	orgApi(fetch, cookies).get<ApiAuditLog[]>(`/api/organization/audit-logs?limit=${limit}`);

export const getQualityControls = (fetch: typeof globalThis.fetch, cookies: Cookies) =>
	orgApi(fetch, cookies).get<ApiQualityControl[]>('/api/organization/quality-controls');

export type ApiQuarantineBatch = {
	id: string;
	produit?: { nom: string };
	statut: string;
	id_materiel_actuel?: string | null;
};

export const getQuarantineBatches = (fetch: typeof globalThis.fetch, cookies: Cookies) =>
	orgApi(fetch, cookies).get<ApiQuarantineBatch[]>('/api/organization/quarantine-batches');

export const getEquipment = (fetch: typeof globalThis.fetch, cookies: Cookies) =>
	orgApi(fetch, cookies).get<ApiEquipment[]>('/api/organization/equipment');

export const createEquipment = (
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	body: { nom: string; type: string; id_lieu: string; temp_seuil_max?: number; sensor_id?: string }
) => orgApi(fetch, cookies).post<ApiEquipment>('/api/organization/equipment', body);

export async function fetchEquipmentLabel(
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	equipmentId: string
): Promise<{ ok: true; buffer: ArrayBuffer } | { ok: false; message: string }> {
	const base = (env.API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
	const cookieHeader = cookies
		.getAll()
		.map((c) => `${c.name}=${c.value}`)
		.join('; ');

	try {
		const res = await fetch(
			`${base}/api/organization/equipment/${encodeURIComponent(equipmentId)}/label`,
			{
				headers: {
					Accept: 'image/png',
					...(cookieHeader ? { Cookie: cookieHeader } : {}),
					...(env.API_KEY ? { 'x-api-key': env.API_KEY } : {})
				}
			}
		);

		if (!res.ok) {
			return {
				ok: false,
				message: res.status === 404 ? 'Étiquette introuvable.' : 'Téléchargement impossible.'
			};
		}

		return { ok: true, buffer: await res.arrayBuffer() };
	} catch {
		return { ok: false, message: 'API injoignable.' };
	}
}

export const getMovements = (
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	opts?: { limit?: number; lotId?: string }
) => {
	const q = new URLSearchParams();
	if (opts?.limit) q.set('limit', String(opts.limit));
	if (opts?.lotId) q.set('lotId', opts.lotId);
	const qs = q.toString();
	return orgApi(fetch, cookies).get<ApiMovement[]>(
		`/api/organization/movements${qs ? `?${qs}` : ''}`
	);
};

export const getSuppliers = (
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	includeArchived = false
) =>
	orgApi(fetch, cookies).get<ApiSupplier[]>(
		`/api/organization/suppliers${includeArchived ? '?includeArchived=true' : ''}`
	);

export const createSupplier = (
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	body: {
		nom_ferme: string;
		adresse_siege: string;
		type_produit?: string;
		contact_qualite?: string;
	}
) => orgApi(fetch, cookies).post<ApiSupplier>('/api/organization/suppliers', body);

export const updateSupplier = (
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	id: string,
	body: Partial<{
		nom_ferme: string;
		adresse_siege: string;
		type_produit: string;
		contact_qualite: string;
	}>
) => orgApi(fetch, cookies).patch<ApiSupplier>(`/api/organization/suppliers/${id}`, body);

export const setSupplierActive = (
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	id: string,
	active: boolean
) =>
	orgApi(fetch, cookies).patch<ApiSupplier>(`/api/organization/suppliers/${id}/active`, { active });

export const getLocations = (
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	includeArchived = false
) =>
	orgApi(fetch, cookies).get<ApiLocation[]>(
		`/api/organization/locations${includeArchived ? '?includeArchived=true' : ''}`
	);

export const createLocation = (
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	body: { nom: string; type: string; description?: string }
) => orgApi(fetch, cookies).post<ApiLocation>('/api/organization/locations', body);

export const updateLocation = (
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	id: string,
	body: Partial<{ nom: string; type: string; description: string }>
) => orgApi(fetch, cookies).patch<ApiLocation>(`/api/organization/locations/${id}`, body);

export const setLocationActive = (
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	id: string,
	active: boolean
) =>
	orgApi(fetch, cookies).patch<ApiLocation>(`/api/organization/locations/${id}/active`, { active });

export const getCustomers = (
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	includeArchived = false
) =>
	orgApi(fetch, cookies).get<ApiCustomer[]>(
		`/api/organization/customers${includeArchived ? '?includeArchived=true' : ''}`
	);

export const createCustomer = (
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	body: { nom_enseigne: string; adresse_livraison: string; email?: string }
) => orgApi(fetch, cookies).post<ApiCustomer>('/api/organization/customers', body);

export const setCustomerActive = (
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	id: string,
	active: boolean
) =>
	orgApi(fetch, cookies).patch<ApiCustomer>(`/api/organization/customers/${id}/active`, { active });

export type ApiProductFull = {
	id: string;
	nom: string;
	code_gtin: string;
	categorie: string;
	is_active: boolean;
};

export const getProductsForConfig = (
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	includeArchived = false
) =>
	orgApi(fetch, cookies).get<ApiProductFull[]>(
		`/api/traceability/products${includeArchived ? '?includeArchived=true' : ''}`
	);

export const createProduct = (
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	body: {
		nom: string;
		code_gtin: string;
		categorie: string;
		duree_conservation_defaut: number;
		seuil_alerte_stock: number;
		unite_reference: string;
	}
) => orgApi(fetch, cookies).post<ApiProductFull>('/api/organization/products', body);

export const setProductActive = (
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	id: string,
	active: boolean
) =>
	orgApi(fetch, cookies).patch<ApiProductFull>(`/api/organization/products/${id}/active`, {
		active
	});

export const getShipments = (fetch: typeof globalThis.fetch, cookies: Cookies) =>
	orgApi(fetch, cookies).get<ApiShipment[]>('/api/organization/shipments');

export type ApiPendingQcBatch = {
	id: string;
	lot_number: string | null;
	quantite_actuelle: string | number;
	unite_code: string;
	date_creation: string;
	produit?: { nom: string };
};

export const getPendingQualityControl = (fetch: typeof globalThis.fetch, cookies: Cookies) =>
	orgApi(fetch, cookies).get<ApiPendingQcBatch[]>('/api/organization/pending-quality-control');

export type QualityControlInput = {
	id_lot: string;
	type_test: string;
	resultat: 'CONFORME' | 'NON_CONFORME';
	notes?: string;
};

export const createQualityControl = (
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	input: QualityControlInput
) =>
	api(fetch, cookies, { useApiKey: false }).post<{ statut_lot: string }>(
		'/api/organization/quality-controls',
		input
	);
