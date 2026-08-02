import type { UserFilters } from '$lib/types/user';

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

/**
 * Query params d'un listing d'utilisateurs filtré : filtres de colonnes posés dans l'URL (la requête
 * part filtrée à l'API), et un nouveau filtre repart en première page.
 *
 * `mfa` est un tri-état d'affichage (`tous`/`actif`/`inactif`) traduit en booléen d'API : l'API ne
 * connaît que `mfa=true|false`, l'absence du paramètre valant « peu importe ».
 */
export function usersSearchParams(current: URLSearchParams, filters: UserFilters): URLSearchParams {
	const params = new URLSearchParams(current);
	setText(params, 'email', filters.email);
	setSelect(params, 'role', filters.role);
	if (filters.mfa === 'actif') params.set('mfa', 'true');
	else if (filters.mfa === 'inactif') params.set('mfa', 'false');
	else params.delete('mfa');
	params.delete('page');
	return params;
}

/** Query params d'un changement de taille de page : la pagination se recompose, on repart en page 1. */
export function usersPageSizeParams(current: URLSearchParams, size: number): URLSearchParams {
	const params = new URLSearchParams(current);
	params.set('limit', String(size));
	params.delete('page');
	return params;
}
