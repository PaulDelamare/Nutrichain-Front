import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import ReceiptFilters from './ReceiptFilters.svelte';
import { emptyReceiptFilters } from '$lib/types/receipt';

describe('ReceiptFilters', () => {
	// Les filtres suivent l'ordre des colonnes du tableau : un ordre différent laisserait croire
	// qu'un filtre porte sur une autre colonne.
	it('ordonne les champs comme les colonnes de la liste', () => {
		render(ReceiptFilters, {
			props: { filters: emptyReceiptFilters() }
		} as unknown as SvelteComponentOptions<typeof ReceiptFilters>);

		const labels = Array.from(document.querySelectorAll('.field > span')).map(
			(el) => el.textContent?.trim() ?? ''
		);

		expect(labels).toEqual(['Réf. expédition', 'Fournisseur', 'Contrôle', 'Date']);
	});

	it('applique immédiatement au changement d’un select', async () => {
		const onapply = vi.fn();
		render(ReceiptFilters, {
			props: {
				filters: emptyReceiptFilters(),
				fournisseurOptions: [
					{ label: 'Tous les fournisseurs', value: 'tous' },
					{ label: 'Ferme Bio', value: 'f1' }
				],
				onapply
			}
		} as unknown as SvelteComponentOptions<typeof ReceiptFilters>);

		await page.getByRole('combobox', { name: 'Fournisseur' }).selectOptions('Ferme Bio');

		await vi.waitFor(() => expect(onapply).toHaveBeenCalledTimes(1));
	});

	it('applique un input texte après le délai (debounce), pas avant', async () => {
		const onapply = vi.fn();
		render(ReceiptFilters, {
			props: { filters: emptyReceiptFilters(), onapply }
		} as unknown as SvelteComponentOptions<typeof ReceiptFilters>);

		await page.getByRole('textbox', { name: 'Réf. expédition' }).fill('BL-');

		expect(onapply).not.toHaveBeenCalled();

		await vi.waitFor(() => expect(onapply).toHaveBeenCalledTimes(1), { timeout: 1500 });
	});
});
