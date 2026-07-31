import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
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

	it('applique immédiatement au changement d’un select', async () => {
		const onapply = vi.fn();
		render(LotFilters, {
			props: {
				filters: emptyLotFilters(),
				produitOptions: [
					{ label: 'Tous les produits', value: 'tous' },
					{ label: 'Beurre', value: 'Beurre' }
				],
				onapply
			}
		} as unknown as SvelteComponentOptions<typeof LotFilters>);

		await page.getByRole('combobox', { name: 'Produit' }).selectOptions('Beurre');

		await vi.waitFor(() => expect(onapply).toHaveBeenCalledTimes(1));
	});

	it('applique un input texte après le délai (debounce), pas avant', async () => {
		const onapply = vi.fn();
		render(LotFilters, {
			props: { filters: emptyLotFilters(), onapply }
		} as unknown as SvelteComponentOptions<typeof LotFilters>);

		await page.getByRole('textbox', { name: 'N° lot' }).fill('260');

		// Rien tout de suite : le debounce n'a pas encore expiré.
		expect(onapply).not.toHaveBeenCalled();

		await vi.waitFor(() => expect(onapply).toHaveBeenCalledTimes(1), { timeout: 1500 });
	});
});
