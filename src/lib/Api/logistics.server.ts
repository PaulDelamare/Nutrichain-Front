import type { Cookies } from '@sveltejs/kit';
import { api } from './client.server';
import type { ApiBatch } from './traceability.server';

/** Routes logistique : auth par session, sans clé API (mixedAuth côté API). */
export function getBatchById(fetch: typeof globalThis.fetch, cookies: Cookies, id: string) {
	return api(fetch, cookies, { useApiKey: false }).get<ApiBatch>(`/api/logistics/batches/${id}`);
}
