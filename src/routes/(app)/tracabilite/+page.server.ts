import type { PageServerLoad } from './$types';
import { getBatches, getGenealogy } from '$lib/Api/traceability.server';
import { getSuppliers } from '$lib/Api/organization.server';
import { buildTraceSteps, genealogyToTraceSteps, mockTraceSteps } from '$lib/utils/org/mappers';

export const load: PageServerLoad = async ({ fetch, cookies, url }) => {
	const lotId = url.searchParams.get('lot');
	const [suppliers, batches] = await Promise.all([
		getSuppliers(fetch, cookies),
		getBatches(fetch, cookies)
	]);

	if (suppliers.ok && batches.ok) {
		// Lot ciblé → généalogie réelle (CTE récursive API) au lieu du parcours générique.
		if (lotId) {
			const genealogy = await getGenealogy(fetch, cookies, lotId);
			if (genealogy.ok) {
				return {
					steps: genealogyToTraceSteps(
						genealogy.data,
						batches.data.find((b) => b.id === lotId)
					),
					lotId,
					source: 'api' as const
				};
			}
		}

		return {
			steps: buildTraceSteps(suppliers.data, batches.data, lotId),
			lotId,
			source: 'api' as const
		};
	}

	return {
		steps: mockTraceSteps,
		lotId,
		source: 'mock' as const,
		error: suppliers.message || batches.message
	};
};
