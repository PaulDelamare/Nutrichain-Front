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
	return api(fetch, cookies, { useApiKey: false }).get<ApiBatch>(
		`/api/logistics/batches/${encodeURIComponent(id)}`
	);
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

export type CreateReceiptBody = {
	id_fournisseur: string;
	shipment_id: string;
	id_produit: string;
	quantite_actuelle: number;
	unite_code: string;
	statut_controle: 'OK' | 'ALERTE' | 'NONCONFORME';
	id_materiel?: string;
	lot_number?: string;
	date_peremption?: string;
};

export type CreateReceiptResult = {
	message: string;
	receiptId: string;
	batchId: string;
};

export function createReceipt(
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	body: CreateReceiptBody
) {
	return api(fetch, cookies, { useApiKey: false }).post<CreateReceiptResult>(
		'/api/logistics/receipts',
		body
	);
}

export type CreateShipmentBody = {
	id_client: string;
	shipment_id: string;
	transporteur: string;
	destination_adresse: string;
	lots: { id_lot: string; quantite_expediee: number }[];
};

export type ApiShipmentCreated = {
	id: string;
	shipment_id: string;
	statut_livraison: string;
};

export function createShipment(
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	body: CreateShipmentBody
) {
	return api(fetch, cookies, { useApiKey: false }).post<{ shipment: ApiShipmentCreated }>(
		'/api/logistics/shipments',
		body
	);
}

/** Résolution exacte par numéro de lot GS1 (AI 10) — équivalent mobile `lookupBatch`. */
export function resolveBatchByLotNumber(
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	lotNumber: string
) {
	const q = new URLSearchParams({ lot_number: lotNumber.trim() });
	return api(fetch, cookies, { useApiKey: false }).get<ApiBatch>(
		`/api/logistics/batches/resolve?${q}`
	);
}
