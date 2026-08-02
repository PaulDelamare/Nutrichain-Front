/**
 * Recherche texte des barres de filtres : elle démarre à 3 caractères. Sous ce seuil, on ne filtre
 * pas — ainsi éditer une requête de 3 vers 2 caractères la relâche au lieu de figer l'ancien
 * résultat. Seuil unique partagé par tous les filtres (lots, non-conformités).
 */
export function matchText(value: string, query: string): boolean {
	const q = query.trim();
	if (q.length < 3) return true;
	return value.toLowerCase().includes(q.toLowerCase());
}

/** Filtre à choix : la sentinelle `tous` ne filtre rien, sinon égalité stricte avec l'option. */
export function matchOption(value: string, filter: string): boolean {
	return filter === 'tous' || value === filter;
}
