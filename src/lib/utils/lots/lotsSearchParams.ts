import type { LotFilters } from '$lib/types/lot';

/** En dessous de 3 caractères, un filtre texte ne s'applique pas (cf. `setText`). */
export const MIN_TEXT_FILTER = 3;

function setText(params: URLSearchParams, key: string, value: string): void {
	const v = value.trim();
	// Seuil de 3 caractères : 1-2 caractères ne filtrent pas, et revenir de 3 à 2 relâche le filtre
	// au lieu de figer l'ancien résultat.
	if (v.length >= MIN_TEXT_FILTER) params.set(key, v);
	else params.delete(key);
}

function setSelect(params: URLSearchParams, key: string, value: string): void {
	// `tous` est la sentinelle « pas de filtre » des selects : on retire le paramètre.
	if (value && value !== 'tous') params.set(key, value);
	else params.delete(key);
}

/**
 * Query params d'une recherche de lots filtrée : les filtres de colonnes sont posés dans l'URL
 * (la requête part filtrée à l'API), et un nouveau filtre repart en première page.
 */
export function lotsSearchParams(current: URLSearchParams, filters: LotFilters): URLSearchParams {
	const params = new URLSearchParams(current);
	setText(params, 'lot', filters.lot);
	setText(params, 'gtin', filters.gtin);
	setSelect(params, 'produit', filters.produit);
	setSelect(params, 'site', filters.site);
	setSelect(params, 'statut', filters.statut);
	params.delete('page');
	return params;
}

/** Query params d'un changement de taille de page : la pagination se recompose donc on repart en page 1. */
export function lotsPageSizeParams(current: URLSearchParams, size: number): URLSearchParams {
	const params = new URLSearchParams(current);
	params.set('limit', String(size));
	params.delete('page');
	return params;
}
