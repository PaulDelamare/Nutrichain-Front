import { goto } from '$app/navigation';

type NavigationOptions = {
	delayMs?: number;
	/**
	 * Paramètres à retirer quand la recherche change. Sans cela, une recherche lancée depuis la
	 * page 4 conserve `?page=4` : le nouveau jeu de résultats en compte souvent moins, et l'écran
	 * s'ouvre sur une page vide.
	 */
	resetParams?: string[];
};

export function schedulePageSearchNavigation(
	basePath: string,
	searchParams: URLSearchParams,
	param: string,
	query: string,
	{ delayMs = 400, resetParams = [] }: NavigationOptions = {}
): () => void {
	const next = query.trim();
	const current = (searchParams.get(param) ?? '').trim();
	if (next === current) return () => {};

	const timer = setTimeout(() => {
		const params = new URLSearchParams(searchParams);
		if (next) params.set(param, next);
		else params.delete(param);
		for (const name of resetParams) params.delete(name);
		const qs = params.toString();
		// basePath doit être passé via resolve() par l'appelant (ex. recherche-lots).
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(`${basePath}${qs ? `?${qs}` : ''}`, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}, delayMs);

	return () => clearTimeout(timer);
}
