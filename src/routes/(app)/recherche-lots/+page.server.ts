import type { PageServerLoad } from './$types';
import { getBatches } from '$lib/Api/traceability.server';
import { getEquipment } from '$lib/Api/organization.server';
import { batchToRow } from '$lib/utils/lots/mapBatch';

const PAGE_SIZE = 50;

const emptyPagination = { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 };

/** Une page hors bornes (`?page=0`, `?page=abc`) est un lien copié de travers, pas une erreur 400. */
function parsePage(raw: string | null): number {
	const parsed = Number(raw);
	return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
}

export const load: PageServerLoad = async ({ fetch, cookies, url }) => {
	const search = url.searchParams.get('q')?.trim() || undefined;
	const page = parsePage(url.searchParams.get('page'));

	const [res, equipment] = await Promise.all([
		getBatches(fetch, cookies, { search, page, limit: PAGE_SIZE }),
		getEquipment(fetch, cookies)
	]);

	if (!res.ok) {
		return {
			lots: [],
			error: res.message,
			searchQuery: search ?? '',
			pagination: emptyPagination
		};
	}

	const tempByEquipment = new Map<string, string | number | null>();
	if (equipment.ok) {
		for (const e of equipment.data) {
			tempByEquipment.set(e.id, e.temp_actuelle);
		}
	}

	return {
		lots: res.data.data.map((b) => batchToRow(b, tempByEquipment)),
		searchQuery: search ?? '',
		pagination: res.data.pagination
	};
};
