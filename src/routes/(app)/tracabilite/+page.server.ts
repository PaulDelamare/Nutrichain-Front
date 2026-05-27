import type { PageServerLoad } from './$types';
import { getBatches } from '$lib/Api/traceability.server';
import { getSuppliers } from '$lib/Api/organization.server';
import { buildTraceSteps, mockTraceSteps } from '$lib/utils/org/mappers';

export const load: PageServerLoad = async ({ fetch, cookies, url }) => {
	const lotId = url.searchParams.get('lot');
	const [suppliers, batches] = await Promise.all([
		getSuppliers(fetch, cookies),
		getBatches(fetch, cookies)
	]);

	if (suppliers.ok && batches.ok) {
		return {
			steps: buildTraceSteps(suppliers.data, batches.data, lotId),
			source: 'api' as const
		};
	}

	return { steps: mockTraceSteps, source: 'mock' as const, error: suppliers.message || batches.message };
};
