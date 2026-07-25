/**
 * Construit le lien vers une page d'une liste paginée, en conservant les autres paramètres de
 * l'URL — sans quoi passer à la page suivante effacerait la recherche en cours.
 *
 * La première page ne porte pas de paramètre : `/recherche-lots` et `/recherche-lots?page=1`
 * désignent la même chose, et deux URL pour un même écran brouillent l'historique et le partage.
 */
export function pageHref(
	basePath: string,
	searchParams: URLSearchParams,
	page: number,
	param = 'page'
): string {
	const params = new URLSearchParams(searchParams);

	if (page > 1) params.set(param, String(page));
	else params.delete(param);

	const qs = params.toString();
	return `${basePath}${qs ? `?${qs}` : ''}`;
}
