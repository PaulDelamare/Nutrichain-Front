import { describe, expect, it } from 'vitest';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import LotFilters from './LotFilters.svelte';
import { emptyLotFilters } from '$lib/types/lot';

describe('LotFilters', () => {
	// Les filtres doivent suivre l'ordre des colonnes de LotTable (Lot, Produit, GTIN, Site,
	// Statut) : un ordre différent laisse croire qu'un filtre porte sur une autre colonne.
	it('ordonne les champs comme les colonnes de la liste', () => {
		render(LotFilters, {
			props: { filters: emptyLotFilters() }
		} as unknown as SvelteComponentOptions<typeof LotFilters>);

		const labels = Array.from(document.querySelectorAll('.field > span')).map(
			(el) => el.textContent?.trim() ?? ''
		);

		expect(labels).toEqual(['N° lot', 'Produit', 'GTIN', 'Site', 'Statut']);
	});
});
