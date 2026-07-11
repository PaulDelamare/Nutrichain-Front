import type { PageServerLoad } from './$types';
import { getQualityControls, getQuarantineBatches } from '$lib/Api/organization.server';
import { batchesToQuarantine, qualityToNc, mockNc, mockQuarantine } from '$lib/utils/org/mappers';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const [quality, quarantine] = await Promise.all([
		getQualityControls(fetch, cookies),
		getQuarantineBatches(fetch, cookies)
	]);

	if (quality.ok && quarantine.ok) {
		return {
			source: 'api' as const,
			openNc: qualityToNc(quality.data),
			quarantineLots: batchesToQuarantine(quarantine.data)
		};
	}

	return {
		source: 'mock' as const,
		openNc: mockNc,
		quarantineLots: mockQuarantine,
		error: quality.message || quarantine.message
	};
};
