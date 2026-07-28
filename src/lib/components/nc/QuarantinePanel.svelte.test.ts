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
			{
				id: 'a26b8f1f-f569-44be-b907-9a6d45b5a00b',
				numero: 'LOT-A',
				detail: 'Beurre — Quarantaine'
			},
			{ id: '9f3e1d20-1111-2222-3333-444455556666', numero: 'LOT-B', detail: 'Lait — Quarantaine' }
		]);

		const buttons = page.getByRole('button', { name: 'Lever la quarantaine' });
		await expect.element(buttons.first()).toBeInTheDocument();
		expect(buttons.all()).toHaveLength(2);
	});

	it('exige un motif sur le champ de levée', async () => {
		renderPanel([
			{
				id: 'a26b8f1f-f569-44be-b907-9a6d45b5a00b',
				numero: 'LOT-A',
				detail: 'Beurre — Quarantaine'
			}
		]);
		const motif = page.getByPlaceholder(/Motif de levée/i);
		await expect.element(motif).toBeInTheDocument();
		await expect.element(motif).toHaveAttribute('required');
	});

	it('affiche un état vide sans lot en quarantaine', async () => {
		renderPanel([]);
		await expect.element(page.getByText('Aucun lot en quarantaine.')).toBeInTheDocument();
	});

	/**
	 * #81 — Le panneau affichait « a26b8f1f-f569-44be-b907-9a6d45b5a00b — Plaquette de Beurre Doux
	 * 250g — bloque ». L'UUID doit rester dans le lien et le formulaire de levée, jamais à l'écran.
	 */
	it('montre le numéro d’étiquette et garde l’UUID pour le lien et la levée (#81)', async () => {
		renderPanel([
			{
				id: 'a26b8f1f-f569-44be-b907-9a6d45b5a00b',
				numero: 'LOT-A',
				detail: 'Beurre — Quarantaine'
			}
		]);

		const lien = page.getByRole('link', { name: 'LOT-A' });
		await expect
			.element(lien)
			.toHaveAttribute('href', '/fiche-lot/a26b8f1f-f569-44be-b907-9a6d45b5a00b');
		expect(page.getByText('a26b8f1f-f569-44be-b907-9a6d45b5a00b').all()).toHaveLength(0);
	});
});
