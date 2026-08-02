import type { LotFilters, LotRow } from '$lib/types/lot';
import { matchOption, matchText } from '$lib/utils/filters/matchText';

export function filterLots(rows: LotRow[], filters: LotFilters): LotRow[] {
	return rows.filter(
		(row) =>
			matchText(row.gtin, filters.gtin) &&
			matchText(row.lotNumber ?? row.id, filters.lot) &&
			matchOption(row.produit, filters.produit) &&
			matchOption(row.site, filters.site) &&
			matchOption(row.statut, filters.statut)
	);
}
