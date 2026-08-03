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
	// Label de catégorisation FACULTATIF (chaîne libre) : `null` quand non renseigné.
	type: string | null;
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
	/** Arrivee constatee. `null` tant que la livraison n a pas ete confirmee. */
	date_livraison: string | null;
	date_envoi: string;
	client?: { nom_enseigne: string };
	liaisons?: { lot: { id: string } }[];
};

function orgApi(fetch: typeof globalThis.fetch, cookies: Cookies) {
	return api(fetch, cookies);
}

export type ApiMemberList = {
	data: ApiMember[];
	pagination: { page: number; limit: number; total: number; totalPages: number };
};

export type MemberQuery = {
	page?: number;
	limit?: number;
	// Filtres de colonnes appliqués côté API (voir GET /organization/members).
	email?: string;
	role?: string;
	mfa?: boolean;
};

export const getMembers = (
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	opts: MemberQuery = {}
) => {
	const params = new URLSearchParams();
	params.set('page', String(opts.page ?? 1));
	params.set('limit', String(opts.limit ?? 25));
	const email = opts.email?.trim();
	if (email) params.set('email', email);
	if (opts.role) params.set('role', opts.role);
	if (opts.mfa !== undefined) params.set('mfa', String(opts.mfa));
	return orgApi(fetch, cookies).get<ApiMemberList>(`/api/organization/members?${params}`);
};

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

export type ApiRecallList = {
	data: ApiAlert[];
	pagination: { page: number; limit: number; total: number; totalPages: number };
};

export type RecallQuery = {
	page?: number;
	limit?: number;
	// Filtres de colonnes appliqués côté API (voir GET /organization/recalls).
	q?: string;
	statut?: string;
};

export const getRecalls = (
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	opts: RecallQuery = {}
) => {
	const params = new URLSearchParams();
	params.set('page', String(opts.page ?? 1));
	params.set('limit', String(opts.limit ?? 25));
	const q = opts.q?.trim();
	if (q) params.set('q', q);
	if (opts.statut) params.set('statut', opts.statut);
	return orgApi(fetch, cookies).get<ApiRecallList>(`/api/organization/recalls?${params}`);
};

export type ApiAuditLogList = {
	data: ApiAuditLog[];
	pagination: { page: number; limit: number; total: number; totalPages: number };
};

export type AuditLogQuery = {
	page?: number;
	limit?: number;
	// Filtres de colonnes appliqués côté API (voir GET /organization/audit-logs).
	action?: string;
	entity?: string;
	entityId?: string;
	// Créneau sur l'horodatage, au format `datetime-local` (`YYYY-MM-DDTHH:mm`).
	from?: string;
	to?: string;
};

export const getAuditLogs = (
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	opts: AuditLogQuery = {}
) => {
	const params = new URLSearchParams();
	params.set('page', String(opts.page ?? 1));
	params.set('limit', String(opts.limit ?? 25));
	if (opts.action) params.set('action', opts.action);
	if (opts.entity) params.set('entity', opts.entity);
	const entityId = opts.entityId?.trim();
	if (entityId) params.set('entity_id', entityId);
	if (opts.from) params.set('from', opts.from);
	if (opts.to) params.set('to', opts.to);
	return orgApi(fetch, cookies).get<ApiAuditLogList>(`/api/organization/audit-logs?${params}`);
};

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

export type ApiSupplierList = {
	data: ApiSupplierComplet[];
	pagination: { page: number; limit: number; total: number; totalPages: number };
};

export type SupplierQuery = {
	page?: number;
	limit?: number;
	// Filtres de colonnes appliqués côté API (voir GET /organization/suppliers, chemin paginé).
	nom?: string;
	statut?: string;
};

/**
 * Écran d'administration : chemin PAGINÉ. `page` présent → l'API renvoie l'enveloppe { data,
 * pagination } et, pour l'administration, les archivés aussi (filtre `statut` absent = tous) avec la
 * fiche complète. N'a de sens qu'appelé derrière `exigerAdministrateur` : c'est le rôle, côté API,
 * qui décide de la projection. `getSuppliers` (sans page) reste le tableau simple des sélecteurs.
 */
export const getSuppliersForConfig = (
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	opts: SupplierQuery = {}
) => {
	const params = new URLSearchParams();
	params.set('page', String(opts.page ?? 1));
	params.set('limit', String(opts.limit ?? 25));
	const nom = opts.nom?.trim();
	if (nom) params.set('nom', nom);
	if (opts.statut) params.set('statut', opts.statut);
	return orgApi(fetch, cookies).get<ApiSupplierList>(`/api/organization/suppliers?${params}`);
};

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

export type ApiLocationList = {
	data: ApiLocation[];
	pagination: { page: number; limit: number; total: number; totalPages: number };
};

export type LocationQuery = {
	page?: number;
	limit?: number;
	// Filtres de colonnes appliqués côté API (voir GET /organization/locations, chemin paginé).
	nom?: string;
	type?: string;
	statut?: string;
};

// Chemin PAGINÉ (écran Configuration) : `page` présent → l'API renvoie l'enveloppe { data,
// pagination }. `getLocations` ci-dessus (sans page) reste le tableau simple pour les sélecteurs.
export const getLocationsForConfig = (
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	opts: LocationQuery = {}
) => {
	const params = new URLSearchParams();
	params.set('page', String(opts.page ?? 1));
	params.set('limit', String(opts.limit ?? 25));
	const nom = opts.nom?.trim();
	if (nom) params.set('nom', nom);
	if (opts.type) params.set('type', opts.type);
	if (opts.statut) params.set('statut', opts.statut);
	return orgApi(fetch, cookies).get<ApiLocationList>(`/api/organization/locations?${params}`);
};

export type ApiConfigCounts = {
	locations: number;
	suppliers: number;
	customers: number;
	products: number;
	equipment: number;
};

export const getConfigCounts = (fetch: typeof globalThis.fetch, cookies: Cookies) =>
	orgApi(fetch, cookies).get<ApiConfigCounts>('/api/organization/config-counts');

export const createLocation = (
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	// `type` est facultatif (simple label) ; `latitude`/`longitude` se saisissent ENSEMBLE.
	body: {
		nom: string;
		type?: string;
		description?: string;
		latitude?: number;
		longitude?: number;
	}
) => orgApi(fetch, cookies).post<ApiLocation>('/api/organization/locations', body);

export const updateLocation = (
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	id: string,
	// `latitude`/`longitude` se modifient ENSEMBLE ; les deux à `null` retirent la position. `type`
	// et `description` à `null` effacent le label (facultatif).
	body: Partial<{
		nom: string;
		type: string | null;
		description: string | null;
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

export type ApiCustomerList = {
	data: ApiCustomerComplet[];
	pagination: { page: number; limit: number; total: number; totalPages: number };
};

export type CustomerQuery = {
	page?: number;
	limit?: number;
	// Filtres de colonnes appliqués côté API (voir GET /organization/customers, chemin paginé).
	nom?: string;
	statut?: string;
};

/**
 * Écran d'administration : chemin PAGINÉ. `page` présent → l'API renvoie l'enveloppe { data,
 * pagination } et, pour l'administration (statut absent), les archivés compris, avec la fiche
 * complète. Voir `getSuppliersForConfig`. `getCustomers` (sans page) reste le tableau simple.
 */
export const getCustomersForConfig = (
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	opts: CustomerQuery = {}
) => {
	const params = new URLSearchParams();
	params.set('page', String(opts.page ?? 1));
	params.set('limit', String(opts.limit ?? 25));
	const nom = opts.nom?.trim();
	if (nom) params.set('nom', nom);
	if (opts.statut) params.set('statut', opts.statut);
	return orgApi(fetch, cookies).get<ApiCustomerList>(`/api/organization/customers?${params}`);
};

export const createCustomer = (
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	body: {
		nom_enseigne: string;
		adresse_livraison: string;
		email?: string;
		contact_urgence?: string;
		notes?: string;
	}
) => orgApi(fetch, cookies).post<ApiCustomer>('/api/organization/customers', body);

export const updateCustomer = (
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	id: string,
	// Les champs facultatifs (email, contact, notes) acceptent `null` : vidés dans la modale, ils
	// s'effacent en base (l'API les déclare `nullable`).
	body: Partial<{
		nom_enseigne: string;
		adresse_livraison: string;
		email: string | null;
		contact_urgence: string | null;
		notes: string | null;
	}>
) =>
	orgApi(fetch, cookies).patch<ApiCustomer>(
		`/api/organization/customers/${encodeURIComponent(id)}`,
		body
	);

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

/**
 * Fiche produit complète servie par le chemin PAGINÉ (écran Configuration) : la durée de
 * conservation, le seuil de stock et l'unité s'y ajoutent pour préremplir la modale d'édition. Le
 * chemin non paginé (`getProductsForConfig`, sélecteurs) n'en a pas besoin et garde `ApiProductFull`.
 */
export type ApiProductComplet = ApiProductFull & {
	duree_conservation_defaut: number;
	seuil_alerte_stock: string | number;
	unite_reference: string;
};

export type ApiProductList = {
	data: ApiProductComplet[];
	pagination: { page: number; limit: number; total: number; totalPages: number };
};

export type ProductQuery = {
	page?: number;
	limit?: number;
	// Filtres de colonnes appliqués côté API (voir GET /traceability/products, chemin paginé).
	nom?: string;
	statut?: string;
};

// Tableau simple (sélecteurs de réception/transformation) : PAS de `page`, l'API renvoie le
// tableau. `includeArchived` reste pour l'administration hors chemin paginé.
export const getProductsForConfig = (
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	includeArchived = false
) =>
	orgApi(fetch, cookies).get<ApiProductFull[]>(
		`/api/traceability/products${includeArchived ? '?includeArchived=true' : ''}`
	);

/**
 * Chemin PAGINÉ de l'onglet Configuration : `page` présent → l'API renvoie l'enveloppe { data,
 * pagination } et, pour l'administration (statut absent), les archivés compris. `getProductsForConfig`
 * ci-dessus reste le tableau simple des sélecteurs.
 */
export const getProductsPaginated = (
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	opts: ProductQuery = {}
) => {
	const params = new URLSearchParams();
	params.set('page', String(opts.page ?? 1));
	params.set('limit', String(opts.limit ?? 25));
	const nom = opts.nom?.trim();
	if (nom) params.set('nom', nom);
	if (opts.statut) params.set('statut', opts.statut);
	return orgApi(fetch, cookies).get<ApiProductList>(`/api/traceability/products?${params}`);
};

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

// Le GTIN et l'unité de référence ne sont PAS éditables (identité GS1, cohérence des lots) : ils
// sont absents du corps accepté par l'API.
export const updateProduct = (
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	id: string,
	body: Partial<{
		nom: string;
		categorie: string;
		duree_conservation_defaut: number;
		seuil_alerte_stock: number;
	}>
) =>
	orgApi(fetch, cookies).patch<ApiProductFull>(
		`/api/organization/products/${encodeURIComponent(id)}`,
		body
	);

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

export type ApiShipmentList = {
	data: ApiShipment[];
	pagination: { page: number; limit: number; total: number; totalPages: number };
};

export type ShipmentQuery = {
	page?: number;
	limit?: number;
	// Filtres de colonnes appliqués côté API (voir GET /organization/shipments).
	ref?: string;
	client?: string;
	statut?: string;
	date?: string;
};

export const getShipments = (
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	opts: ShipmentQuery = {}
) => {
	const params = new URLSearchParams();
	params.set('page', String(opts.page ?? 1));
	params.set('limit', String(opts.limit ?? 50));
	const ref = opts.ref?.trim();
	if (ref) params.set('ref', ref);
	if (opts.client) params.set('client', opts.client);
	if (opts.statut) params.set('statut', opts.statut);
	if (opts.date) params.set('date', opts.date);
	return orgApi(fetch, cookies).get<ApiShipmentList>(`/api/organization/shipments?${params}`);
};

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
