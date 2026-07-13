import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import PendingQcPanel from './PendingQcPanel.svelte';
import type { PendingQcLot } from '$lib/types/quality';

function lot(id = 'lot-1'): PendingQcLot {
	return {
		id,
		lot: '260713-000203',
		produit: 'Bouteille de Lait 1L',
		quantite: '1200 L',
		depuis: "aujourd'hui"
	};
}

function renderPanel(lots: PendingQcLot[], props: Record<string, unknown> = {}) {
	render(PendingQcPanel, {
		props: { lots, ...props }
	} as unknown as SvelteComponentOptions<typeof PendingQcPanel>);
}

describe('PendingQcPanel', () => {
	it('annonce qu’aucun lot n’attend de contrôle', async () => {
		renderPanel([]);

		await expect.element(page.getByText('Aucun lot en attente de contrôle.')).toBeInTheDocument();
	});

	it('dit pourquoi le lot est bloqué — sinon l’utilisateur ne comprend pas', async () => {
		renderPanel([lot()]);

		await expect
			.element(page.getByText(/ne peut ni être expédié ni transformé/))
			.toBeInTheDocument();
	});

	// Le formulaire n'est pas ouvert d'emblée : la page ne doit pas devenir un mur de champs.
	it('ouvre le formulaire de saisie à la demande', async () => {
		renderPanel([lot()]);

		await expect.element(page.getByText('Type de test')).not.toBeInTheDocument();

		await page.getByRole('button', { name: 'Saisir le contrôle' }).click();

		await expect.element(page.getByText('Type de test')).toBeInTheDocument();
	});

	// Les deux issues sont explicites : l'utilisateur voit la CONSÉQUENCE avant de cliquer.
	it('nomme la conséquence de chaque décision', async () => {
		renderPanel([lot()]);
		await page.getByRole('button', { name: 'Saisir le contrôle' }).click();

		await expect
			.element(page.getByRole('button', { name: 'Conforme — libérer le lot' }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Non conforme — mettre en quarantaine' }))
			.toBeInTheDocument();
	});

	it('affiche le refus de l’API sur le lot concerné', async () => {
		renderPanel([lot()], {
			errorLotId: 'lot-1',
			errorMessage: 'Ce lot est sous rappel produit : la décision est irréversible.'
		});

		await expect.element(page.getByText(/sous rappel produit/)).toBeInTheDocument();
	});
});
