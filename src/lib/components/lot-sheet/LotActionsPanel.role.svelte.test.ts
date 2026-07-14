import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import LotActionsPanel from './LotActionsPanel.svelte';
import type { LotStatus } from '$lib/types/lot';
import type { KnownRole } from '$lib/config/roles';

function renderPanel(statut: LotStatus, role: KnownRole) {
	render(LotActionsPanel, {
		props: { lotId: 'LOT-1', statut, form: null, role }
	} as unknown as SvelteComponentOptions<typeof LotActionsPanel>);
}

describe('LotActionsPanel — décisions qualité', () => {
	it("refuse le rappel produit à l'opérateur, et lui dit pourquoi", async () => {
		renderPanel('conforme', 'operator');

		expect(page.getByRole('button', { name: 'Déclencher le rappel' }).all()).toHaveLength(0);
		await expect.element(page.getByText(/HACCP/i)).toBeInTheDocument();
	});

	it('refuse le rappel produit au lecteur', async () => {
		renderPanel('conforme', 'viewer');

		expect(page.getByRole('button', { name: 'Déclencher le rappel' }).all()).toHaveLength(0);
	});

	it('autorise le rappel au rôle qualité', async () => {
		renderPanel('conforme', 'quality');

		await expect
			.element(page.getByRole('button', { name: 'Déclencher le rappel' }))
			.toBeInTheDocument();
	});

	it("refuse la levée de quarantaine à l'opérateur mais lui laisse le contexte du lot", async () => {
		renderPanel('quarantaine', 'operator');

		expect(page.getByRole('button', { name: 'Lever la quarantaine' }).all()).toHaveLength(0);
		await expect.element(page.getByText('Lever la quarantaine')).toBeInTheDocument();
	});

	it("laisse la traçabilité accessible à tous — c'est une lecture", async () => {
		renderPanel('conforme', 'viewer');

		await expect
			.element(page.getByRole('button', { name: /Voir la traçabilité/i }))
			.toBeInTheDocument();
	});

	it("n'ampute rien quand le rôle est inconnu (API sans le champ)", async () => {
		renderPanel('conforme', undefined);

		await expect
			.element(page.getByRole('button', { name: 'Déclencher le rappel' }))
			.toBeInTheDocument();
	});
});
