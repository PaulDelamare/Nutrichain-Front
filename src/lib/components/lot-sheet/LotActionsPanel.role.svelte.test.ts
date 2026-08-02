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

	it("refuse les DEUX levées à l'opérateur mais lui laisse le contexte du lot", async () => {
		renderPanel('quarantaine', 'operator');

		expect(page.getByRole('button', { name: 'Lever la quarantaine froid' }).all()).toHaveLength(0);
		expect(page.getByRole('button', { name: 'Lever la quarantaine qualité' }).all()).toHaveLength(
			0
		);
		await expect.element(page.getByText('Lever la quarantaine froid')).toBeInTheDocument();
		await expect.element(page.getByText('Lever la quarantaine qualité')).toBeInTheDocument();
	});

	/**
	 * #254 — La mise au rebut est la SEULE sortie d'un lot bloqué : la levée rend 409, et un contrôle
	 * conforme aussi. Elle détruit de la marchandise, donc elle relève de la décision qualité, comme
	 * la levée et le rappel.
	 */
	it("refuse la mise au rebut à l'opérateur — détruire n'est pas de la manutention", async () => {
		renderPanel('quarantaine', 'operator');

		expect(page.getByRole('button', { name: 'Mettre au rebut' }).all()).toHaveLength(0);
	});

	it('autorise la mise au rebut au rôle qualité, sur un lot bloqué', async () => {
		renderPanel('quarantaine', 'quality');

		await expect.element(page.getByRole('button', { name: 'Mettre au rebut' })).toBeInTheDocument();
	});

	it('autorise la mise au rebut sur un lot sous rappel — le stock resté chez nous', async () => {
		renderPanel('surveillance', 'quality');

		await expect.element(page.getByRole('button', { name: 'Mettre au rebut' })).toBeInTheDocument();
	});

	it("ne la propose pas sur un lot conforme — l'API la refuserait en 409", async () => {
		renderPanel('conforme', 'quality');

		expect(page.getByRole('button', { name: 'Mettre au rebut' }).all()).toHaveLength(0);
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
