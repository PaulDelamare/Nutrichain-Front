import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getBatchById } from '$lib/Api/logistics.server';
import { getMovements } from '$lib/Api/organization.server';
import { getBatches } from '$lib/Api/traceability.server';
import type { ApiBatch } from '$lib/Api/traceability.server';
import { batchToSheet } from '$lib/utils/lots/mapBatch';

async function loadFromCatalog(
	fetch: typeof globalThis.fetch,
	cookies: import('@sveltejs/kit').Cookies,
	lotId: string
): Promise<ApiBatch | null> {
	const [list, movements] = await Promise.all([
		getBatches(fetch, cookies),
		getMovements(fetch, cookies, { lotId, limit: 10 })
	]);

	if (!list.ok) return null;

	const batch = list.data.find((b) => b.id === lotId);
	if (!batch) return null;

	return {
		...batch,
		mouvements: movements.ok ? movements.data : []
	};
}

export const load: PageServerLoad = async ({ fetch, cookies, params }) => {
	const res = await getBatchById(fetch, cookies, params.lotId);

	if (res.ok) {
		return { sheet: batchToSheet(res.data), source: 'api' as const };
	}

	const fromCatalog = await loadFromCatalog(fetch, cookies, params.lotId);
	if (fromCatalog) {
		return { sheet: batchToSheet(fromCatalog), source: 'api' as const };
	}

	if (res.status === 404) {
		error(404, { message: `Le lot « ${params.lotId} » est introuvable.` });
	}
	if (res.status === 403) {
		error(403, { message: res.message || 'Accès refusé à ce lot.' });
	}
	error(res.status, { message: res.message });
};
