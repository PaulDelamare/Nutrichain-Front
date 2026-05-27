import { getContext, setContext } from 'svelte';

export const PAGE_SEARCH_KEY = Symbol('pageSearch');

const DEFAULT_PLACEHOLDER = 'Recherche non disponible sur cette page';

export class PageSearchContext {
	query = $state('');
	placeholder = $state(DEFAULT_PLACEHOLDER);
	active = $state(false);

	resetQuery() {
		this.query = '';
	}

	configure(placeholder: string) {
		this.placeholder = placeholder;
		this.active = true;
	}

	deactivate() {
		this.placeholder = DEFAULT_PLACEHOLDER;
		this.active = false;
		this.query = '';
	}
}

export function initPageSearchContext(): PageSearchContext {
	const ctx = new PageSearchContext();
	setContext(PAGE_SEARCH_KEY, ctx);
	return ctx;
}

export function usePageSearch(): PageSearchContext {
	return getContext(PAGE_SEARCH_KEY);
}

/** À appeler dans un $effect de page : enregistre le placeholder et nettoie au démontage. */
export function pageSearchScope(placeholder: string): () => void {
	const ctx = usePageSearch();
	ctx.configure(placeholder);
	return () => ctx.deactivate();
}
