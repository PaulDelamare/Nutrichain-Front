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
	// État avant/après l'action (contient le motif d'une levée de quarantaine, un changement de statut, etc.)
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

export type ApiQuarantineBatch = {
	id: string;
	produit?: { nom: string };
	statut: string;
	// Emplacement (matériel) où le lot est stocké — sert à relier un lot à l'alerte froid de son frigo.
	id_materiel_actuel?: string | null;
};

export const getQuarantineBatches = (fetch: typeof globalThis.fetch, cookies: Cookies) =>
	orgApi(fetch, cookies).get<ApiQuarantineBatch[]>('/api/organization/quarantine-batches');

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

export const getCustomers = (fetch: typeof globalThis.fetch, cookies: Cookies) =>
	orgApi(fetch, cookies).get<ApiCustomer[]>('/api/organization/customers');

export const getShipments = (fetch: typeof globalThis.fetch, cookies: Cookies) =>
	orgApi(fetch, cookies).get<ApiShipment[]>('/api/organization/shipments');

/** Lot en attente de son contrôle qualité de sortie d'usine (barrière HACCP). */
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

// Une décision qualité engage une PERSONNE : elle passe par la session, jamais par la clé API
// (une clé identifie une application, elle n'autorise pas une action).
export const createQualityControl = (
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	input: QualityControlInput
) =>
	api(fetch, cookies, { useApiKey: false }).post<{ statut_lot: string }>(
		'/api/organization/quality-controls',
		input
	);
