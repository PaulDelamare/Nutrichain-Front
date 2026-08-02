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

export type ReceiptQuery = {
	page?: number;
	limit?: number;
	// Filtres de colonnes appliqués côté API (voir GET /logistics/receipts).
	ref?: string;
	fournisseur?: string;
	statut?: string;
	date?: string;
};

export function getReceipts(
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	opts: ReceiptQuery = {}
) {
	const params = new URLSearchParams();
	params.set('page', String(opts.page ?? 1));
	params.set('limit', String(opts.limit ?? 50));
	const ref = opts.ref?.trim();
	if (ref) params.set('ref', ref);
	if (opts.fournisseur) params.set('fournisseur', opts.fournisseur);
	if (opts.statut) params.set('statut', opts.statut);
	if (opts.date) params.set('date', opts.date);
	return api(fetch, cookies, { useApiKey: false }).get<ApiReceiptList>(
		`/api/logistics/receipts?${params}`
	);
}

/** Une palette et ce qu'elle porte, tels que le scan d'un SSCC les rend. */
export type ApiLogisticUnit = {
	id: string;
	sscc: string;
	source: string;
	created_at: string;
	/** Un lot passé sous rappel APRÈS la palettisation — c'est ce qui rend le rappel actionnable. */
	contient_lot_rappele: boolean;
	/** Position déduite des lots. `null` si la palette n'est pas rangée, ou si ses lots divergent. */
	id_materiel: string | null;
	positions_divergentes: boolean;
	/**
	 * Renseignée, la palette a été OUVERTE : elle a cessé d'exister comme unité de manutention, et
	 * ses lots sont redevenus autonomes. Irréversible.
	 */
	ouverture: { date: string } | null;
	lots: Array<{
		id: string;
		numero_lot: string;
		produit: string;
		gtin: string;
		quantite: number;
		unite: string;
		statut: string;
		date_peremption: string | null;
	}>;
	/**
	 * Ce que la palette portait au moment de l'ouverture, avec le statut ACTUEL de chaque lot.
	 *
	 * Ce n'est PAS son contenu — `lots` est vide et c'est exact. C'est une trace : la marchandise
	 * peut être encore posée dessus, et un lot passé sous rappel depuis doit rester visible au quai.
	 * La quantité est celle de l'ouverture, jamais réactualisée.
	 */
	dernier_contenu: Array<{
		id: string;
		numero_lot: string;
		produit: string;
		gtin: string;
		quantite_a_l_ouverture: number;
		unite: string;
		statut: string;
		date_peremption: string | null;
	}>;
};

export function getLogisticUnitBySscc(
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	sscc: string
) {
	return api(fetch, cookies, { useApiKey: false }).get<ApiLogisticUnit>(
		`/api/logistics/logistic-units/by-sscc/${encodeURIComponent(sscc)}`
	);
}

export function batchLabelPath(lotId: string): string {
	return `/fiche-lot/${encodeURIComponent(lotId)}/label`;
}

export type LabelDownload = { ok: true; buffer: ArrayBuffer } | { ok: false; message: string };

/**
 * Télécharge une étiquette PNG depuis l'API, session comprise.
 *
 * Ces téléchargements contournent l'enveloppe JSON du client : la réponse est une image. La
 * session voyage par le cookie relayé — un `<img>` du navigateur, lui, ne la porterait pas vers
 * l'API, qui refuserait en 401.
 */
async function fetchLabel(
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	path: string
): Promise<LabelDownload> {
	const base = (env.API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
	const cookieHeader = cookies
		.getAll()
		.map((c) => `${c.name}=${c.value}`)
		.join('; ');

	try {
		const res = await fetch(`${base}${path}`, {
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

export function fetchBatchLabel(
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	lotId: string
): Promise<LabelDownload> {
	return fetchLabel(fetch, cookies, `/api/logistics/batches/${encodeURIComponent(lotId)}/label`);
}

export function fetchLogisticUnitLabel(
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	unitId: string
): Promise<LabelDownload> {
	return fetchLabel(
		fetch,
		cookies,
		`/api/logistics/logistic-units/${encodeURIComponent(unitId)}/label`
	);
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

/**
 * Sortie définitive d'un lot : il quitte la chaîne, sa quantité tombe à zéro.
 *
 * L'API ne l'accepte que sur un lot `BLOQUE` ou `ALERTE`. Sans ce geste, un lot bloqué par erreur
 * n'avait AUCUNE issue — la levée de quarantaine et un contrôle conforme rendent tous deux 409, et
 * le rebut n'était appelable depuis aucune interface (#254).
 *
 * ⚠️ Ce n'est PAS le retrait d'un magasin. Celui-ci porte sur une ligne d'expédition, pas sur le
 * lot : déclarer ici la destruction détruirait aussi le stock resté à l'usine et celui parti chez
 * les autres clients.
 */
export function scrapBatch(
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	lotId: string,
	motif: string
) {
	return api(fetch, cookies).post<ApiBatch>(
		`/api/logistics/batches/${encodeURIComponent(lotId)}/scrap`,
		{ motif }
	);
}

/** Ce qu'un magasin a reçu, retiré, et ce qu'il lui reste à retirer pour un lot. */
export type ApiShelfWithdrawalProgress = {
	customerId: string;
	customerName: string;
	quantiteLivree: string;
	quantiteRetiree: string;
	resteARetirer: string;
	unite: string;
	retraits: {
		id: string;
		quantite: string;
		motif: string;
		constateAupresDe: string | null;
		createdAt: string;
	}[];
};

export type ApiShelfWithdrawalResult = {
	id: string;
	quantiteLivree: string;
	quantiteRetiree: string;
	resteARetirer: string;
	unite: string;
};

/**
 * Avancement du retrait, par magasin. Le reste-à-retirer vient de l'API : le recalculer ici
 * dupliquerait la règle qui gouverne l'écriture, donc la ferait diverger.
 */
export function getShelfWithdrawals(
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	lotId: string
) {
	return api(fetch, cookies).get<{ batchId: string; clients: ApiShelfWithdrawalProgress[] }>(
		`/api/logistics/batches/${encodeURIComponent(lotId)}/withdrawals`
	);
}

/**
 * L'unité n'est PAS envoyée : elle est reprise du lot côté API. L'ajouter ici permettrait de
 * déclarer 500 g contre un plafond exprimé en kg.
 */
export function recordShelfWithdrawal(
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	lotId: string,
	body: { id_client: string; quantite: number; motif: string; constate_aupres_de?: string }
) {
	return api(fetch, cookies).post<ApiShelfWithdrawalResult>(
		`/api/logistics/batches/${encodeURIComponent(lotId)}/withdrawals`,
		body
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

/**
 * Constate l'arrivée d'une expédition.
 *
 * Sans ce geste, `statut_livraison` restait figé à `EN_ROUTE` depuis la création, et le rappel
 * produit remontait cette information au décideur : toute expédition apparaissait en transit, même
 * livrée depuis des semaines.
 *
 * Idempotent côté API : rejouer rend 200 avec la date déjà retenue.
 */
export function confirmShipmentDelivery(
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	shipmentId: string
) {
	return api(fetch, cookies, { useApiKey: false }).post<{
		id: string;
		shipment_id: string;
		statut_livraison: string;
		date_livraison: string;
		lots_livres: number;
	}>(`/api/logistics/shipments/${encodeURIComponent(shipmentId)}/delivered`, {});
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
