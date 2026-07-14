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
	nom_produit: string;
	statut: string;
	quantite_actuelle?: string | number;
	unite_code?: string;
	date_peremption?: string | null;
};

export type ApiGenealogy = {
	batchId: string;
	upstream: ApiGenealogyBatch[];
	downstream: ApiGenealogyBatch[];
};

export function getBatches(fetch: typeof globalThis.fetch, cookies: Cookies) {
	return api(fetch, cookies).get<ApiBatch[]>('/api/traceability/batches');
}

export function getProducts(fetch: typeof globalThis.fetch, cookies: Cookies) {
	return api(fetch, cookies).get<ApiProduct[]>('/api/traceability/products');
}

/**
 * Généalogie d'un lot (amont + aval). Lecture seule : sert à estimer l'impact d'un rappel
 * sans déclencher de blocage. Route protégée par session web (mixedAuth → pas de clé API).
 */
export function getBatchGenealogy(
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	id: string
) {
	return api(fetch, cookies, { useApiKey: false }).get<ApiGenealogy>(
		`/api/traceability/batches/${id}/genealogy`
	);
}
