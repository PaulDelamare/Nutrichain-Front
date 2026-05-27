import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getBatches } from '$lib/Api/traceability.server';
import { batchToRow } from '$lib/utils/lots/mapBatch';
import { lots as mockLots } from '$lib/data/lot-search';

export const load: PageServerLoad = async ({ fetch, cookies, url }) => {
	const legacyLot = url.searchParams.get('lot');
	if (legacyLot) {
		redirect(301, `/fiche-lot/${encodeURIComponent(legacyLot)}`);
	}

	const res = await getBatches(fetch, cookies);

	if (res.ok) {
		return {
			lots: res.data.map(batchToRow),
			source: 'api' as const
		};
	}

	return {
		lots: mockLots,
		source: 'mock' as const,
		error: res.message
	};
};
