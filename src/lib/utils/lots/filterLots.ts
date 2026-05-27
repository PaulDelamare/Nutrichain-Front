import type { LotFilters, LotRow } from '$lib/types/lot';

function match(value: string, query: string): boolean {
	if (!query.trim()) return true;
	return value.toLowerCase().includes(query.trim().toLowerCase());
}

function matchSite(site: string, filter: string): boolean {
	if (filter === 'tous') return true;
	return site.toLowerCase() === filter.toLowerCase();
}

function matchStatut(statut: LotRow['statut'], filter: string): boolean {
	if (filter === 'tous') return true;
	return statut === filter;
}

export function filterLots(rows: LotRow[], filters: LotFilters): LotRow[] {
	return rows.filter(
		(row) =>
			match(row.gtin, filters.gtin) &&
			match(row.id, filters.lot) &&
			match(row.sscc, filters.sscc) &&
			matchSite(row.site, filters.site) &&
			matchStatut(row.statut, filters.statut)
	);
}
