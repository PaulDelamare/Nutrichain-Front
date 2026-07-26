import type { Cookies } from '@sveltejs/kit';
import { api } from './client.server';
import type { ApiAlert } from './organization.server';

/** Lot encore isolé par une alerte — cf. GET /api/alerts/:id/batches. */
export type ApiAlertBatch = {
	id: string;
	lot_number: string;
	quantite_actuelle: string | number;
	unite_code: string;
	produit: { nom: string } | null;
	levable: boolean;
	motif_blocage: 'CONTROLE_NON_CONFORME' | null;
};

/** Lots que CETTE alerte retient encore (pas les autres BLOQUE du même frigo). */
export function getAlertBatches(fetch: typeof globalThis.fetch, cookies: Cookies, alertId: string) {
	return api(fetch, cookies, { useApiKey: false }).get<ApiAlertBatch[]>(
		`/api/alerts/${encodeURIComponent(alertId)}/batches`
	);
}

/** Clôture une alerte (froid, rappel, …) — auth session, rôles qualité côté API. */
export function resolveAlert(
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	alertId: string,
	note?: string
) {
	const trimmed = note?.trim();
	return api(fetch, cookies, { useApiKey: false }).patch<{ alert: ApiAlert }>(
		`/api/alerts/${encodeURIComponent(alertId)}/resolve`,
		trimmed ? { note: trimmed } : {}
	);
}
