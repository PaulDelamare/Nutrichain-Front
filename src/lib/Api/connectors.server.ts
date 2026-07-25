import type { Cookies } from '@sveltejs/kit';
import { api } from './client.server';

export type ImportRowResult = {
	line: number;
	status: 'created' | 'updated' | 'error';
	ref?: string;
	message?: string;
};

export type ImportReport = {
	total: number;
	created: number;
	updated: number;
	errors: number;
	results: ImportRowResult[];
};

// Import CSV réservé à l'administration côté API (ADMIN_ROLES) : décision qui engage une personne,
// donc session obligatoire, jamais la clé API seule.
const csvApi = (fetch: typeof globalThis.fetch, cookies: Cookies) =>
	api(fetch, cookies, { useApiKey: false });

export const importProductsCsv = (fetch: typeof globalThis.fetch, cookies: Cookies, csv: string) =>
	csvApi(fetch, cookies).postText<ImportReport>('/api/connectors/imports/products', csv);

export const importCustomersCsv = (fetch: typeof globalThis.fetch, cookies: Cookies, csv: string) =>
	csvApi(fetch, cookies).postText<ImportReport>('/api/connectors/imports/customers', csv);
