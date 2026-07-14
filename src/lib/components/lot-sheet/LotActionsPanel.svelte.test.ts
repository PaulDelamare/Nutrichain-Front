import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import LotActionsPanel from './LotActionsPanel.svelte';

type Statut = 'conforme' | 'surveillance' | 'quarantaine';

function renderPanel(statut: Statut) {
	render(LotActionsPanel, {
		props: { lotId: 'lot-1', statut, form: null }
	} as unknown as SvelteComponentOptions<typeof LotActionsPanel>);
}

describe('LotActionsPanel', () => {
	it('lot conforme → propose de déclencher un rappel', async () => {
		renderPanel('conforme');
		await expect
			.element(page.getByRole('button', { name: 'Déclencher le rappel' }))
			.toBeInTheDocument();
	});

	it('lot en quarantaine → propose de lever la quarantaine', async () => {
		renderPanel('quarantaine');
		await expect
			.element(page.getByRole('button', { name: 'Lever la quarantaine' }))
			.toBeInTheDocument();
	});

	it('lot déjà sous rappel → aucun nouveau rappel possible', async () => {
		renderPanel('surveillance');
		await expect.element(page.getByText('Rappel en cours')).toBeInTheDocument();
		expect(page.getByRole('button', { name: 'Déclencher le rappel' }).all()).toHaveLength(0);
	});
});
