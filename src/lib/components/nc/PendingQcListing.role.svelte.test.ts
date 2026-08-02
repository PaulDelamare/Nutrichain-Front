import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import PendingQcListing from './PendingQcListing.svelte';
import type { KnownRole } from '$lib/config/roles';

const ROWS = [{ id: 'l1', lot: 'LOT-QC', produit: 'Yaourt', quantite: '100 kg', depuis: '2 h' }];

function renderListing(role: KnownRole, props: Record<string, unknown> = {}) {
	render(PendingQcListing, {
		props: { rows: ROWS, role, ...props }
	} as unknown as SvelteComponentOptions<typeof PendingQcListing>);
}

describe('PendingQcListing — la barrière qualité ne se signe pas soi-même', () => {
	it("refuse la saisie d'un contrôle à l'opérateur : il produit le lot, il ne le valide pas", async () => {
		renderListing('operator');

		expect(page.getByRole('button', { name: 'Saisir le contrôle' }).all()).toHaveLength(0);
		await expect.element(page.getByText(/HACCP/i)).toBeInTheDocument();
	});

	it("laisse l'opérateur voir les lots en attente", async () => {
		renderListing('operator');

		await expect.element(page.getByText('LOT-QC')).toBeInTheDocument();
	});

	it('autorise la saisie au rôle qualité', async () => {
		renderListing('quality');

		await expect
			.element(page.getByRole('button', { name: 'Saisir le contrôle' }))
			.toBeInTheDocument();
	});

	it('refuse la saisie au lecteur', async () => {
		renderListing('viewer');

		expect(page.getByRole('button', { name: 'Saisir le contrôle' }).all()).toHaveLength(0);
	});

	it("n'ampute rien quand le rôle est inconnu (API sans le champ)", async () => {
		renderListing(undefined);

		await expect
			.element(page.getByRole('button', { name: 'Saisir le contrôle' }))
			.toBeInTheDocument();
	});

	it('ouvre la modale via le rappel onsaisir, avec le lot cliqué', async () => {
		const onsaisir = vi.fn();
		renderListing('quality', { onsaisir });

		await page.getByRole('button', { name: 'Saisir le contrôle' }).click();

		expect(onsaisir).toHaveBeenCalledWith(ROWS[0]);
	});
});
