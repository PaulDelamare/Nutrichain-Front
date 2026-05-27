import type { Cookies } from '@sveltejs/kit';
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
};

export type ApiCustomer = {
	id: string;
	nom_enseigne: string;
	adresse_livraison: string;
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

export const getAlerts = (fetch: typeof globalThis.fetch, cookies: Cookies) =>
	orgApi(fetch, cookies).get<ApiAlert[]>('/api/organization/alerts');

export const getAuditLogs = (fetch: typeof globalThis.fetch, cookies: Cookies, limit = 30) =>
	orgApi(fetch, cookies).get<ApiAuditLog[]>(`/api/organization/audit-logs?limit=${limit}`);

export const getQualityControls = (fetch: typeof globalThis.fetch, cookies: Cookies) =>
	orgApi(fetch, cookies).get<ApiQualityControl[]>('/api/organization/quality-controls');

export const getQuarantineBatches = (fetch: typeof globalThis.fetch, cookies: Cookies) =>
	orgApi(fetch, cookies).get<
		{ id: string; produit?: { nom: string }; statut: string }[]
	>('/api/organization/quarantine-batches');

export const getEquipment = (fetch: typeof globalThis.fetch, cookies: Cookies) =>
	orgApi(fetch, cookies).get<ApiEquipment[]>('/api/organization/equipment');

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

export const getSuppliers = (fetch: typeof globalThis.fetch, cookies: Cookies) =>
	orgApi(fetch, cookies).get<ApiSupplier[]>('/api/organization/suppliers');

export const getCustomers = (fetch: typeof globalThis.fetch, cookies: Cookies) =>
	orgApi(fetch, cookies).get<ApiCustomer[]>('/api/organization/customers');

export const getShipments = (fetch: typeof globalThis.fetch, cookies: Cookies) =>
	orgApi(fetch, cookies).get<ApiShipment[]>('/api/organization/shipments');
