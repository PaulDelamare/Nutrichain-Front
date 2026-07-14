import type { Cookies } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { api } from './client.server';
import type { ApiBatch } from './traceability.server';

export type ApiReceipt = {
	id: string;
	shipment_id: string;
	statut_controle: string;
	date_reception: string;
	fournisseur?: { nom_ferme: string };
};

export type ApiReceiptList = {
	data: ApiReceipt[];
	pagination: { page: number; limit: number; total: number; totalPages: number };
};

/** Routes logistique : auth par session, sans clé API (mixedAuth côté API). */
export function getBatchById(fetch: typeof globalThis.fetch, cookies: Cookies, id: string) {
	return api(fetch, cookies, { useApiKey: false }).get<ApiBatch>(`/api/logistics/batches/${id}`);
}

export function getReceipts(
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	page = 1,
	limit = 50
) {
	return api(fetch, cookies, { useApiKey: false }).get<ApiReceiptList>(
		`/api/logistics/receipts?page=${page}&limit=${limit}`
	);
}

export function batchLabelPath(lotId: string): string {
	return `/fiche-lot/${encodeURIComponent(lotId)}/label`;
}

export async function fetchBatchLabel(
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	lotId: string
): Promise<{ ok: true; buffer: ArrayBuffer } | { ok: false; message: string }> {
	const base = (env.API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
	const cookieHeader = cookies
		.getAll()
		.map((c) => `${c.name}=${c.value}`)
		.join('; ');

	try {
		const res = await fetch(`${base}/api/logistics/batches/${encodeURIComponent(lotId)}/label`, {
			headers: {
				Accept: 'image/png',
				...(cookieHeader ? { Cookie: cookieHeader } : {}),
				...(env.API_KEY ? { 'x-api-key': env.API_KEY } : {})
			}
		});

		if (!res.ok) {
			return { ok: false, message: res.status === 404 ? 'Étiquette introuvable.' : 'Téléchargement impossible.' };
		}

		return { ok: true, buffer: await res.arrayBuffer() };
	} catch {
		return { ok: false, message: 'API injoignable.' };
	}
}

export function releaseQuarantine(
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	lotId: string,
	motif: string
) {
	return api(fetch, cookies).post<ApiBatch>(
		`/api/logistics/batches/${encodeURIComponent(lotId)}/release`,
		{ motif }
	);
}
