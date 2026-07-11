import type { LotFilters, LotRow } from '$lib/types/lot';

function match(value: string, query: string): boolean {
	if (!query.trim()) return true;
	return value.toLowerCase().includes(query.trim().toLowerCase());
}

function matchProduit(produit: string, filter: string): boolean {
	if (filter === 'tous') return true;
	return produit === filter;
}

function matchStatut(statut: LotRow['statut'], filter: string): boolean {
	if (filter === 'tous') return true;
	return statut === filter;
}

export function filterLots(rows: LotRow[], filters: LotFilters): LotRow[] {
	return rows.filter(
		(row) =>
			match(row.gtin, filters.gtin) &&
			// le filtre « N° lot » cible le numéro de lot GS1 affiché (repli id).
			match(row.lotNumber ?? row.id, filters.lot) &&
			matchProduit(row.produit, filters.produit) &&
			matchStatut(row.statut, filters.statut)
	);
}
