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
	/**
	 * Contexte de la décision (motif de levée, pic de température, résultat QC…). Sans lui, la
	 * frise de la fiche lot affiche le type d'événement mais pas le « pourquoi » (#30).
	 */
	metadata?: Record<string, unknown> | null;
};

/**
 * Ce que TOUT rôle reçoit d'un fournisseur — l'identité métier, rien de plus.
 *
 * L'API restreint sa projection hors administration (`organization.service.ts` : `select: { id,
 * nom_ferme }`) : ni adresse du siège, ni contact qualité, ni `is_active`. Le type le dit, pour que
 * la prochaine tentative de refiltrer sur `is_active` soit une erreur de compilation et non un
 * sélecteur vide en production (#82).
 */
export type ApiSupplier = {
	id: string;
	nom_ferme: string;
};

/** Fournisseur complet — réservé à l'administration (`PERSONAL_DATA_ROLES` côté API). */
export type ApiSupplierComplet = ApiSupplier & {
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
	// Position du lieu, saisie dans Configuration. Chaînes (colonnes DECIMAL côté API), `null` tant
	// qu'elle n'a pas été renseignée — la fiche lot n'affiche alors pas de carte (cf. #23).
	latitude?: string | number | null;
	longitude?: string | number | null;
	is_active: boolean;
};

/**
 * Ce que TOUT rôle reçoit d'un client. L'adresse de livraison en fait partie : c'est une donnée
 * d'EXPLOITATION, elle pré-remplit la destination de l'expédition. Le contact d'urgence, l'e-mail,
 * les notes et `is_active` restent réservés à l'administration (#82).
 */
export type ApiCustomer = {
	id: string;
	nom_enseigne: string;
	adresse_livraison: string;
};

/** Client complet — réservé à l'administration (`PERSONAL_DATA_ROLES` côté API). */
export type ApiCustomerComplet = ApiCustomer & {
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
	api(fetch, cookies, { useApiKey: false }).patch(
		`/api/organization/members/${encodeURIComponent(memberId)}/role`,
		{
			role
		}
	);

export const revokeMember = (fetch: typeof globalThis.fetch, cookies: Cookies, memberId: string) =>
	api(fetch, cookies, { useApiKey: false }).post(
		`/api/organization/members/${encodeURIComponent(memberId)}/revoke`,
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

/** Fournisseurs actifs — l'API a déjà écarté les archivés. À ne pas refiltrer (#82). */
export const getSuppliers = (fetch: typeof globalThis.fetch, cookies: Cookies) =>
	orgApi(fetch, cookies).get<ApiSupplier[]>('/api/organization/suppliers');

/**
 * Écran d'administration : les archivés AUSSI, pour pouvoir les réactiver — et la fiche complète.
 * N'a de sens qu'appelé derrière `exigerAdministrateur` : c'est le rôle, côté API, qui décide de la
 * projection. Un rôle terrain recevrait ici une charge utile plus pauvre que le type ne l'annonce.
 */
export const getSuppliersForConfig = (fetch: typeof globalThis.fetch, cookies: Cookies) =>
	orgApi(fetch, cookies).get<ApiSupplierComplet[]>(
		'/api/organization/suppliers?includeArchived=true'
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
) =>
	orgApi(fetch, cookies).patch<ApiSupplier>(
		`/api/organization/suppliers/${encodeURIComponent(id)}`,
		body
	);

export const setSupplierActive = (
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	id: string,
	active: boolean
) =>
	orgApi(fetch, cookies).patch<ApiSupplier>(
		`/api/organization/suppliers/${encodeURIComponent(id)}/active`,
		{ active }
	);

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
	// `latitude`/`longitude` se modifient ENSEMBLE ; les deux à `null` retirent la position.
	body: Partial<{
		nom: string;
		type: string;
		description: string;
		latitude: number | null;
		longitude: number | null;
	}>
) =>
	orgApi(fetch, cookies).patch<ApiLocation>(
		`/api/organization/locations/${encodeURIComponent(id)}`,
		body
	);

export const setLocationActive = (
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	id: string,
	active: boolean
) =>
	orgApi(fetch, cookies).patch<ApiLocation>(
		`/api/organization/locations/${encodeURIComponent(id)}/active`,
		{ active }
	);

/** Clients actifs — l'API a déjà écarté les archivés. À ne pas refiltrer (#82). */
export const getCustomers = (fetch: typeof globalThis.fetch, cookies: Cookies) =>
	orgApi(fetch, cookies).get<ApiCustomer[]>('/api/organization/customers');

/** Écran d'administration : les archivés aussi, et la fiche complète. Voir `getSuppliersForConfig`. */
export const getCustomersForConfig = (fetch: typeof globalThis.fetch, cookies: Cookies) =>
	orgApi(fetch, cookies).get<ApiCustomerComplet[]>(
		'/api/organization/customers?includeArchived=true'
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
	orgApi(fetch, cookies).patch<ApiCustomer>(
		`/api/organization/customers/${encodeURIComponent(id)}/active`,
		{ active }
	);

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
	orgApi(fetch, cookies).patch<ApiProductFull>(
		`/api/organization/products/${encodeURIComponent(id)}/active`,
		{
			active
		}
	);

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
