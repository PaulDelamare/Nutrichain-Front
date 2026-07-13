import type { PageServerLoad } from './$types';
import { getBatches } from '$lib/Api/traceability.server';
import { batchToRow } from '$lib/utils/lots/mapBatch';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const res = await getBatches(fetch, cookies);

	if (!res.ok) {
		return { lots: [], error: res.message };
	}

	return { lots: res.data.map(batchToRow) };
};
