import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import QuarantinePanel from './QuarantinePanel.svelte';
import type { QuarantineLot } from '$lib/types/nc';

function renderPanel(lots: QuarantineLot[]) {
	render(QuarantinePanel, {
		props: { lots }
	} as unknown as SvelteComponentOptions<typeof QuarantinePanel>);
}

describe('QuarantinePanel', () => {
	it('affiche un formulaire de levée par lot bloqué', async () => {
		renderPanel([
			{ lot: 'LOT-A', detail: 'Beurre — bloque' },
			{ lot: 'LOT-B', detail: 'Lait — bloque' }
		]);

		const buttons = page.getByRole('button', { name: 'Lever la quarantaine' });
		await expect.element(buttons.first()).toBeInTheDocument();
		expect(buttons.all()).toHaveLength(2);
	});

	it('exige un motif sur le champ de levée', async () => {
		renderPanel([{ lot: 'LOT-A', detail: 'Beurre — bloque' }]);
		const motif = page.getByPlaceholder(/Motif de levée/i);
		await expect.element(motif).toBeInTheDocument();
		await expect.element(motif).toHaveAttribute('required');
	});

	it('affiche un état vide sans lot en quarantaine', async () => {
		renderPanel([]);
		await expect.element(page.getByText('Aucun lot en quarantaine.')).toBeInTheDocument();
	});
});
