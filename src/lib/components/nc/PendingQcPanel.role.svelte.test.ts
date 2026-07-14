import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import PendingQcPanel from './PendingQcPanel.svelte';
import type { KnownRole } from '$lib/config/roles';

const LOTS = [{ id: 'l1', lot: 'LOT-QC', produit: 'Yaourt', quantite: '100 kg', depuis: '2 h' }];

function renderPanel(role: KnownRole) {
	render(PendingQcPanel, {
		props: { lots: LOTS, role }
	} as unknown as SvelteComponentOptions<typeof PendingQcPanel>);
}

describe('PendingQcPanel — la barrière qualité ne se signe pas soi-même', () => {
	it("refuse la saisie d'un contrôle à l'opérateur : il produit le lot, il ne le valide pas", async () => {
		renderPanel('operator');

		expect(page.getByRole('button', { name: 'Saisir le contrôle' }).all()).toHaveLength(0);
		await expect.element(page.getByText(/HACCP/i)).toBeInTheDocument();
	});

	// Masquer l'écriture ne doit pas masquer la lecture : l'opérateur doit savoir que son lot
	// est bloqué en attente de contrôle, sinon il le croit expédiable.
	it("laisse l'opérateur voir les lots en attente", async () => {
		renderPanel('operator');

		await expect.element(page.getByText('LOT-QC')).toBeInTheDocument();
	});

	it('autorise la saisie au rôle qualité', async () => {
		renderPanel('quality');

		await expect
			.element(page.getByRole('button', { name: 'Saisir le contrôle' }))
			.toBeInTheDocument();
	});

	it('refuse la saisie au lecteur', async () => {
		renderPanel('viewer');

		expect(page.getByRole('button', { name: 'Saisir le contrôle' }).all()).toHaveLength(0);
	});

	it("n'ampute rien quand le rôle est inconnu (API sans le champ)", async () => {
		renderPanel(undefined);

		await expect
			.element(page.getByRole('button', { name: 'Saisir le contrôle' }))
			.toBeInTheDocument();
	});
});
