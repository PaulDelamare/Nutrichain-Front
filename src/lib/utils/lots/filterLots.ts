import type { LotFilters, LotRow } from '$lib/types/lot';

function match(value: string, query: string): boolean {
	const q = query.trim();
	// La recherche texte démarre à 3 caractères : 1-2 caractères ne filtrent pas. Ainsi, éditer une
	// requête de 3 vers 2 caractères la relâche au lieu de figer l'ancien résultat.
	if (q.length < 3) return true;
	return value.toLowerCase().includes(q.toLowerCase());
}

function matchProduit(produit: string, filter: string): boolean {
	if (filter === 'tous') return true;
	return produit === filter;
}

function matchSite(site: string, filter: string): boolean {
	if (filter === 'tous') return true;
	return site === filter;
}

function matchStatut(statut: LotRow['statut'], filter: string): boolean {
	if (filter === 'tous') return true;
	return statut === filter;
}

export function filterLots(rows: LotRow[], filters: LotFilters): LotRow[] {
	return rows.filter(
		(row) =>
			match(row.gtin, filters.gtin) &&
			match(row.lotNumber ?? row.id, filters.lot) &&
			matchProduit(row.produit, filters.produit) &&
			matchSite(row.site, filters.site) &&
			matchStatut(row.statut, filters.statut)
	);
}
