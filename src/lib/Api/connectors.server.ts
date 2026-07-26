import type { Cookies } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
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

/** Export EPCIS CSV (réponse texte brute, pas d’enveloppe JSON). */
export async function exportEpcisEventsCsv(
	fetch: typeof globalThis.fetch,
	cookies: Cookies
): Promise<{ ok: true; csv: string } | { ok: false; message: string }> {
	const base = (env.API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
	const cookieHeader = cookies
		.getAll()
		.map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
		.join('; ');

	try {
		const res = await fetch(`${base}/api/connectors/exports/events`, {
			headers: {
				Accept: 'text/csv',
				...(cookieHeader ? { Cookie: cookieHeader } : {})
			}
		});

		if (!res.ok) {
			return {
				ok: false,
				message:
					res.status === 403
						? 'Export réservé aux membres de l’organisation.'
						: 'Export impossible.'
			};
		}

		return { ok: true, csv: await res.text() };
	} catch {
		return { ok: false, message: 'API injoignable.' };
	}
}
