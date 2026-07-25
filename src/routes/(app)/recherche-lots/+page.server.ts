import type { PageServerLoad } from './$types';
import { getBatches } from '$lib/Api/traceability.server';
import { getEquipment } from '$lib/Api/organization.server';
import { batchToRow } from '$lib/utils/lots/mapBatch';

export const load: PageServerLoad = async ({ fetch, cookies, url }) => {
	const search = url.searchParams.get('q')?.trim() || undefined;

	const [res, equipment] = await Promise.all([
		getBatches(fetch, cookies, { search }),
		getEquipment(fetch, cookies)
	]);

	if (!res.ok) {
		return { lots: [], error: res.message, searchQuery: search ?? '', cappedAt100: false };
	}

	const tempByEquipment = new Map<string, string | number | null>();
	if (equipment.ok) {
		for (const e of equipment.data) {
			tempByEquipment.set(e.id, e.temp_actuelle);
		}
	}

	return {
		lots: res.data.map((b) => batchToRow(b, tempByEquipment)),
		searchQuery: search ?? '',
		cappedAt100: !search && res.data.length >= 100
	};
};
