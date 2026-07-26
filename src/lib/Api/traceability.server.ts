import type { Cookies } from '@sveltejs/kit';
import { api } from './client.server';

export type ApiBatchMouvement = {
	id: number;
	type_action: string;
	quantite: string | number;
	unite: string;
	created_at: string;
	user?: { name: string } | null;
	metadata?: Record<string, unknown> | null;
};

export type ApiBatch = {
	id: string;
	lot_number?: string | null;
	statut: string;
	quantite_actuelle: string | number;
	unite_code: string;
	date_peremption: string | null;
	date_creation?: string;
	produit?: { nom: string; code_gtin: string };
	unite?: { nom: string };
	id_materiel_actuel?: string | null;
	materiel?: {
		nom: string;
		// `latitude`/`longitude` : position SAISIE du lieu, seule source du repère de la fiche lot.
		// Chaînes côté API (colonnes DECIMAL), `null` tant que le lieu n'est pas positionné.
		lieu?: {
			nom: string;
			type?: string;
			latitude?: string | number | null;
			longitude?: string | number | null;
		};
		temp_actuelle?: string | number | null;
		temp_seuil_max?: string | number | null;
		statut?: string;
	};
	user?: { name: string; email?: string };
	mouvements?: ApiBatchMouvement[];
};

export type ApiProduct = {
	id: string;
	nom: string;
	code_gtin: string;
	categorie?: string;
};

export type ApiGenealogyBatch = {
	id: string;
	nom_produit: string;
	statut: string;
	lot_number?: string | null;
	quantite_actuelle?: string | number;
	unite_code?: string;
	date_peremption?: string | null;
};

export type ApiOrigin = {
	lot_number: string;
	date_reception: string;
	fournisseur: { id: string; nom_ferme: string };
};

export type ApiGenealogy = {
	batchId: string;
	upstream: ApiGenealogyBatch[];
	downstream: ApiGenealogyBatch[];
	// Points d'entrée matière première (la ferme). Optionnel : une API antérieure ne l'expose pas.
	origines?: ApiOrigin[];
};

export type ApiRecallShipment = {
	shipmentId: string;
	shipmentRef: string;
	customerId: string;
	customerName: string;
	customerContact?: string | null;
	customerEmail?: string | null;
	customerAddress?: string;
	dateEnvoi: string;
	statutLivraison: string;
	transporteur: string;
	batchIds: string[];
};

export type ApiRecallResult = {
	blockedBatchesCount: number;
	impactedBatchIds: string[];
	affectedShipments: ApiRecallShipment[];
	depthSaturated: boolean;
};

export type ApiPagination = { page: number; limit: number; total: number; totalPages: number };

export type ApiBatchPage = {
	data: ApiBatch[];
	/** `total` compte TOUS les lots correspondants, pas seulement ceux de la page reçue. */
	pagination: ApiPagination;
};

export type BatchQuery = { search?: string; page?: number; limit?: number };

/**
 * Plafond de volumétrie de l'API. Les écrans qui ne paginent pas (sélecteurs de lot, tableau de
 * bord) le demandent explicitement : mieux vaut une liste large et bornée qu'un défaut à 100 qui
 * masque quatre lots sur cinq sans le dire.
 */
export const MAX_BATCH_PAGE_SIZE = 500;

function batchQueryString(opts?: BatchQuery): string {
	const params = new URLSearchParams();
	const q = opts?.search?.trim();

	if (q) params.set('q', q);
	if (opts?.page) params.set('page', String(opts.page));
	if (opts?.limit) params.set('limit', String(opts.limit));

	return params.size > 0 ? `?${params}` : '';
}

/**
 * Ramène une réponse à la forme paginée. Une API antérieure à la pagination répond par un tableau
 * nu : sans ce repli, tout écran affichant des lots planterait pendant la fenêtre de déploiement
 * où les deux versions coexistent.
 */
function toBatchPage(data: ApiBatchPage | ApiBatch[] | null): ApiBatchPage {
	if (Array.isArray(data)) {
		const total = data.length;
		return { data, pagination: { page: 1, limit: total, total, totalPages: 1 } };
	}

	return data ?? { data: [], pagination: { page: 1, limit: 0, total: 0, totalPages: 0 } };
}

export async function getBatches(
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	opts?: BatchQuery
) {
	const res = await api(fetch, cookies).get<ApiBatchPage | ApiBatch[] | null>(
		`/api/traceability/batches${batchQueryString(opts)}`
	);

	return res.ok ? { ...res, data: toBatchPage(res.data) } : res;
}

/**
 * Même lecture, réduite aux lignes : les écrans qui remplissent un sélecteur n'ont que faire du
 * numéro de page. Ils gardent en revanche le plafond explicite, pour ne pas s'arrêter à 100 lots.
 */
export async function getBatchList(
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	opts?: BatchQuery
) {
	const res = await getBatches(fetch, cookies, { limit: MAX_BATCH_PAGE_SIZE, ...opts });
	return res.ok ? { ...res, data: res.data.data } : res;
}

export function getGenealogy(fetch: typeof globalThis.fetch, cookies: Cookies, lotId: string) {
	return api(fetch, cookies).get<ApiGenealogy>(
		`/api/traceability/batches/${encodeURIComponent(lotId)}/genealogy`
	);
}

export function triggerRecall(
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	lotId: string,
	reason: string
) {
	return api(fetch, cookies).post<ApiRecallResult>(
		`/api/traceability/batches/${encodeURIComponent(lotId)}/recall`,
		{ reason }
	);
}

export function getProducts(fetch: typeof globalThis.fetch, cookies: Cookies) {
	return api(fetch, cookies).get<ApiProduct[]>('/api/traceability/products');
}

export function getBatchGenealogy(fetch: typeof globalThis.fetch, cookies: Cookies, id: string) {
	return api(fetch, cookies, { useApiKey: false }).get<ApiGenealogy>(
		`/api/traceability/batches/${id}/genealogy`
	);
}

export type ApiEpcisEvent = {
	id: string;
	event_time: string;
	event_type: string;
	related_entity: string;
	related_id: string;
	payload: Record<string, unknown>;
};

export type ApiEpcisEventPage = {
	data: ApiEpcisEvent[];
	pagination: { page: number; limit: number; total: number; totalPages: number };
};

export type EventsQuery = {
	page?: number;
	limit?: number;
	eventType?: string;
	relatedEntity?: string;
};

function eventsQueryString(opts?: EventsQuery): string {
	const params = new URLSearchParams();
	if (opts?.page) params.set('page', String(opts.page));
	if (opts?.limit) params.set('limit', String(opts.limit));
	if (opts?.eventType) params.set('event_type', opts.eventType);
	if (opts?.relatedEntity) params.set('related_entity', opts.relatedEntity);
	return params.size > 0 ? `?${params}` : '';
}

export function getEvents(fetch: typeof globalThis.fetch, cookies: Cookies, opts?: EventsQuery) {
	return api(fetch, cookies).get<ApiEpcisEventPage>(
		`/api/traceability/events${eventsQueryString(opts)}`
	);
}
