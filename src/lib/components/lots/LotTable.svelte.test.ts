import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import LotTable from './LotTable.svelte';
import StatusBadge from './StatusBadge.svelte';
import type { LotRow } from '$lib/types/lot';

function lot(partial: Partial<LotRow> = {}): LotRow {
	return {
		id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
		lotNumber: '260711-000201',
		produit: 'Bouteille de Lait 1L',
		gtin: '03701234500012',
		site: 'Usine Loire',
		statut: 'conforme',
		temperature: '4 °C',
		...partial
	};
}

function renderTable(rows: LotRow[]) {
	render(LotTable, { props: { rows } } as unknown as SvelteComponentOptions<typeof LotTable>);
}

describe('LotTable', () => {
	it('dit clairement que la recherche ne renvoie rien plutôt que d’afficher un tableau vide', async () => {
		renderTable([]);
		await expect
			.element(page.getByText('Aucun lot ne correspond aux filtres.'))
			.toBeInTheDocument();
	});

	it('identifie le lot par son numéro GS1, celui lu sur l’étiquette', async () => {
		renderTable([lot()]);
		await expect.element(page.getByRole('link', { name: '260711-000201' })).toBeInTheDocument();
	});

	it('retombe sur l’identifiant technique quand le lot n’a pas de numéro GS1', async () => {
		renderTable([lot({ lotNumber: undefined, id: 'lot-sans-numero' })]);
		await expect.element(page.getByRole('link', { name: 'lot-sans-numero' })).toBeInTheDocument();
	});

	it('mène à la fiche du lot — c’est le point d’entrée du parcours de traçabilité', async () => {
		renderTable([lot({ id: 'lot-1' })]);
		const lien = page.getByRole('link', { name: '260711-000201' });
		await expect.element(lien).toHaveAttribute('href', expect.stringContaining('lot-1'));
	});

	it('affiche la température relevée, pas une colonne vide', async () => {
		renderTable([lot({ temperature: '7,2 °C' })]);
		await expect.element(page.getByText('7,2 °C')).toBeInTheDocument();
	});

	it('affiche une ligne par lot', async () => {
		renderTable([lot({ id: 'a', lotNumber: 'A-1' }), lot({ id: 'b', lotNumber: 'B-2' })]);
		await expect.element(page.getByRole('link', { name: 'A-1' })).toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: 'B-2' })).toBeInTheDocument();
	});
});

describe('StatusBadge', () => {
	it('affiche le statut en toutes lettres', async () => {
		render(StatusBadge, { props: { statut: 'quarantaine' } } as unknown as SvelteComponentOptions<
			typeof StatusBadge
		>);
		await expect.element(page.getByText('Quarantaine')).toBeInTheDocument();
	});

	it('n’invente pas d’état pour un lot dont l’API ne dit rien', async () => {
		render(StatusBadge, { props: { statut: 'inconnu' } } as unknown as SvelteComponentOptions<
			typeof StatusBadge
		>);
		await expect.element(page.getByText('Inconnu')).toBeInTheDocument();
	});
});
