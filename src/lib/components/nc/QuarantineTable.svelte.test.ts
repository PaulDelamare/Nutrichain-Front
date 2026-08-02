import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import QuarantineTable from './QuarantineTable.svelte';
import type { QuarantineLot } from '$lib/types/nc';

function renderTable(rows: QuarantineLot[], canAct = false) {
	render(QuarantineTable, {
		props: { rows, canAct }
	} as unknown as SvelteComponentOptions<typeof QuarantineTable>);
}

describe('QuarantineTable', () => {
	it('affiche un état vide quand aucun lot ne correspond', async () => {
		renderTable([]);
		await expect.element(page.getByText(/Aucun lot ne correspond/)).toBeInTheDocument();
	});

	/**
	 * #81 — Le panneau affichait « a26b8f1f-f569-44be-b907-9a6d45b5a00b — … — bloque ». L'UUID doit
	 * rester dans le lien (fiche-lot), jamais à l'écran ; ce qu'on lit est le numéro d'étiquette.
	 */
	it('montre le numéro d’étiquette et garde l’UUID pour le lien (#81)', async () => {
		renderTable([
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
