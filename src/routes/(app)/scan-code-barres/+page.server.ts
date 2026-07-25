import type { PageServerLoad } from './$types';
import { getBatchList } from '$lib/Api/traceability.server';
import { getEquipment } from '$lib/Api/organization.server';
import { batchToRow } from '$lib/utils/lots/mapBatch';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const [res, equipment] = await Promise.all([
		getBatchList(fetch, cookies),
		getEquipment(fetch, cookies)
	]);

	if (!res.ok) {
		return { lots: [], error: res.message };
	}

	const tempByEquipment = new Map<string, string | number | null>();
	if (equipment.ok) {
		for (const e of equipment.data) {
			tempByEquipment.set(e.id, e.temp_actuelle);
		}
	}

	return {
		lots: res.data.map((b) => batchToRow(b, tempByEquipment))
	};
};
