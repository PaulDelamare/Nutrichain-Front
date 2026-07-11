import type { Cookies } from '@sveltejs/kit';
import { api } from './client.server';

export type ApiBatchMouvement = {
	id: number;
	type_action: string;
	quantite: string | number;
	unite: string;
	created_at: string;
	user?: { name: string } | null;
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
	materiel?: {
		nom: string;
		lieu?: { nom: string; type?: string };
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
	statut: string;
	nom_produit: string;
	lot_number?: string | null;
	date_peremption?: string | null;
};

export type ApiGenealogy = {
	batchId: string;
	upstream: ApiGenealogyBatch[];
	downstream: ApiGenealogyBatch[];
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

export function getBatches(fetch: typeof globalThis.fetch, cookies: Cookies) {
	return api(fetch, cookies).get<ApiBatch[]>('/api/traceability/batches');
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
