import type { Cookies } from '@sveltejs/kit';
import { api } from './client.server';
import type { ApiBatch } from './traceability.server';

/** Routes logistique : auth par session, sans clé API (mixedAuth côté API). */
export function getBatchById(fetch: typeof globalThis.fetch, cookies: Cookies, id: string) {
	return api(fetch, cookies, { useApiKey: false }).get<ApiBatch>(`/api/logistics/batches/${id}`);
}

/**
 * Lève la quarantaine d'un lot (décision qualité). Le motif est obligatoire côté API
 * (≥ 3 caractères) et tracé dans l'audit WORM. Rôles QA/admin/owner requis.
 */
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
