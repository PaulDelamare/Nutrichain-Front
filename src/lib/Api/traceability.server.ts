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

export function getBatches(fetch: typeof globalThis.fetch, cookies: Cookies) {
	return api(fetch, cookies).get<ApiBatch[]>('/api/traceability/batches');
}

export function getProducts(fetch: typeof globalThis.fetch, cookies: Cookies) {
	return api(fetch, cookies).get<ApiProduct[]>('/api/traceability/products');
}
