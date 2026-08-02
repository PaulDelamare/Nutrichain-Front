import type { ReceiptFilters } from '$lib/types/receipt';

/** En dessous de 3 caractères, un filtre texte ne s'applique pas (cf. `setText`). */
export const MIN_TEXT_FILTER = 3;

function setText(params: URLSearchParams, key: string, value: string): void {
	const v = value.trim();
	// Seuil de 3 caractères : 1-2 caractères ne filtrent pas, et revenir de 3 à 2 relâche le filtre.
	if (v.length >= MIN_TEXT_FILTER) params.set(key, v);
	else params.delete(key);
}

function setSelect(params: URLSearchParams, key: string, value: string): void {
	// `tous` est la sentinelle « pas de filtre » des selects : on retire le paramètre.
	if (value && value !== 'tous') params.set(key, value);
	else params.delete(key);
}

function setDate(params: URLSearchParams, key: string, value: string): void {
	// Un jour (YYYY-MM-DD) ou rien : pas de seuil de caractères comme pour le texte libre.
	const v = value.trim();
	if (v) params.set(key, v);
	else params.delete(key);
}

/**
 * Query params d'un listing de réceptions filtré : filtres de colonnes posés dans l'URL (la requête
 * part filtrée à l'API), et un nouveau filtre repart en première page.
 */
export function receptionsSearchParams(
	current: URLSearchParams,
	filters: ReceiptFilters
): URLSearchParams {
	const params = new URLSearchParams(current);
	setText(params, 'ref', filters.ref);
	setSelect(params, 'fournisseur', filters.fournisseur);
	setSelect(params, 'statut', filters.statut);
	setDate(params, 'date', filters.date);
	params.delete('page');
	return params;
}

/** Query params d'un changement de taille de page : la pagination se recompose, on repart en page 1. */
export function receptionsPageSizeParams(current: URLSearchParams, size: number): URLSearchParams {
	const params = new URLSearchParams(current);
	params.set('limit', String(size));
	params.delete('page');
	return params;
}
