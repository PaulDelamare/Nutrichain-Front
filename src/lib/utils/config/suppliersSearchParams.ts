import type { SupplierFilters } from '$lib/types/supplier';

/** En dessous de 3 caractères, un filtre texte ne s'applique pas (cf. `setText`). */
export const MIN_TEXT_FILTER = 3;

function setText(params: URLSearchParams, key: string, value: string): void {
	const v = value.trim();
	// Seuil de 3 caractères : 1-2 caractères ne filtrent pas, et revenir de 3 à 2 relâche le filtre.
	if (v.length >= MIN_TEXT_FILTER) params.set(key, v);
	else params.delete(key);
}

function setSelect(params: URLSearchParams, key: string, value: string): void {
	// `tous` est la sentinelle « pas de filtre » du select : on retire le paramètre.
	if (value && value !== 'tous') params.set(key, value);
	else params.delete(key);
}

/**
 * Query params du listing des fournisseurs (onglet Configuration). On garde `tab=suppliers` dans
 * l'URL (onglets = navigation), les filtres partent à l'API et un nouveau filtre repart en page 1.
 */
export function suppliersSearchParams(
	current: URLSearchParams,
	filters: SupplierFilters
): URLSearchParams {
	const params = new URLSearchParams(current);
	params.set('tab', 'suppliers');
	setText(params, 'nom', filters.nom);
	setSelect(params, 'statut', filters.statut);
	params.delete('page');
	return params;
}

/** Query params d'un changement de taille de page : la pagination se recompose, on repart en page 1. */
export function suppliersPageSizeParams(current: URLSearchParams, size: number): URLSearchParams {
	const params = new URLSearchParams(current);
	params.set('tab', 'suppliers');
	params.set('limit', String(size));
	params.delete('page');
	return params;
}
