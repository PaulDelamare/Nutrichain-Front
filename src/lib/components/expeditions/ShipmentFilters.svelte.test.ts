import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import ShipmentFilters from './ShipmentFilters.svelte';
import { emptyShipmentFilters } from '$lib/types/shipment';

describe('ShipmentFilters', () => {
	it('ordonne les champs comme les colonnes de la liste', () => {
		render(ShipmentFilters, {
			props: { filters: emptyShipmentFilters() }
		} as unknown as SvelteComponentOptions<typeof ShipmentFilters>);

		const labels = Array.from(document.querySelectorAll('.field > span')).map(
			(el) => el.textContent?.trim() ?? ''
		);

		expect(labels).toEqual(['Référence', 'Client', 'Statut', 'Date envoi']);
	});

	it('applique immédiatement au changement d’un select', async () => {
		const onapply = vi.fn();
		render(ShipmentFilters, {
			props: {
				filters: emptyShipmentFilters(),
				clientOptions: [
					{ label: 'Tous les clients', value: 'tous' },
					{ label: 'Super U', value: 'c1' }
				],
				onapply
			}
		} as unknown as SvelteComponentOptions<typeof ShipmentFilters>);

		await page.getByRole('combobox', { name: 'Client' }).selectOptions('Super U');

		await vi.waitFor(() => expect(onapply).toHaveBeenCalledTimes(1));
	});

	it('applique un input texte après le délai (debounce), pas avant', async () => {
		const onapply = vi.fn();
		render(ShipmentFilters, {
			props: { filters: emptyShipmentFilters(), onapply }
		} as unknown as SvelteComponentOptions<typeof ShipmentFilters>);

		await page.getByRole('textbox', { name: 'Référence' }).fill('SSC');

		expect(onapply).not.toHaveBeenCalled();

		await vi.waitFor(() => expect(onapply).toHaveBeenCalledTimes(1), { timeout: 1500 });
	});
});
