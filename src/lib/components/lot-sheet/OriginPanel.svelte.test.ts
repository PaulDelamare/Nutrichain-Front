import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import OriginPanel from './OriginPanel.svelte';
import type { ApiOrigin } from '$lib/Api/traceability.server';

function renderPanel(origines: ApiOrigin[]) {
	render(OriginPanel, { props: { origines } } as unknown as SvelteComponentOptions<
		typeof OriginPanel
	>);
}

describe('OriginPanel — amont / ferme', () => {
	it('nomme la ferme d’origine et son numéro de lot', async () => {
		renderPanel([
			{
				lot_number: 'LAIT-001',
				date_reception: '2026-07-14T08:00:00Z',
				fournisseur: { id: 'sup-1', nom_ferme: 'Ferme des Aubépines' }
			}
		]);

		await expect.element(page.getByText('Ferme des Aubépines')).toBeInTheDocument();
		await expect.element(page.getByText(/LAIT-001/)).toBeInTheDocument();
	});

	// Un produit fini pur (aucune réception rattachée) ne doit pas laisser la section vide sans mot :
	// on explique pourquoi il n'y a pas d'amont, au lieu d'un blanc ambigu.
	it('explique l’absence d’origine plutôt que d’afficher un vide', async () => {
		renderPanel([]);

		await expect.element(page.getByText(/Aucune réception rattachée/)).toBeInTheDocument();
	});
});
