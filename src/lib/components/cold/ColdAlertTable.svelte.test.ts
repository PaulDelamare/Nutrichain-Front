import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import ColdAlertTable from './ColdAlertTable.svelte';
import type { KnownRole } from '$lib/config/roles';
import type { ColdAlertRow } from '$lib/types/cold';

function alerte(partial: Partial<ColdAlertRow> = {}): ColdAlertRow {
	return {
		id: 'ALT-2026-031',
		alertId: '11111111-2222-3333-4444-555555555555',
		site: 'Usine Loire',
		zone: 'Chambre froide 2',
		tempActuelle: '9,4 °C',
		depuis: 'depuis 42 min',
		statut: 'critique',
		lotsImpactes: [
			{ id: 'lot-1', produit: 'Bouteille de Lait 1L', levable: true, motifBlocage: null }
		],
		...partial
	};
}

function renderTable(rows: ColdAlertRow[], role: KnownRole = 'quality') {
	render(ColdAlertTable, {
		props: { rows, role }
	} as unknown as SvelteComponentOptions<typeof ColdAlertTable>);
}

describe('ColdAlertTable', () => {
	it('affiche la température relevée et depuis combien de temps elle dérive', async () => {
		renderTable([alerte()]);
		await expect.element(page.getByText('9,4 °C')).toBeInTheDocument();
		await expect.element(page.getByText('depuis 42 min')).toBeInTheDocument();
	});

	// Une excursion de température qui s'affiche « Investigation » fait perdre un temps décisif.
	it('affiche la gravité réelle de l’alerte', async () => {
		renderTable([alerte()]);
		await expect.element(page.getByText('Critique')).toBeInTheDocument();
	});

	it('renvoie vers la fiche de chaque lot impacté', async () => {
		renderTable([alerte()]);
		const lien = page.getByRole('link', { name: 'Bouteille de Lait 1L' });
		await expect.element(lien).toHaveAttribute('href', expect.stringContaining('lot-1'));
	});

	it('marque explicitement une alerte sans lot connu plutôt que de laisser la case vide', async () => {
		renderTable([alerte({ lotsImpactes: [] })]);
		await expect.element(page.getByText('—')).toBeInTheDocument();
	});

	it('liste toutes les alertes en cours', async () => {
		renderTable([
			alerte({ id: 'ALT-1', alertId: 'a1' }),
			alerte({ id: 'ALT-2', alertId: 'a2', statut: 'investigation' })
		]);
		await expect.element(page.getByText('ALT-1')).toBeInTheDocument();
		await expect.element(page.getByText('Investigation')).toBeInTheDocument();
	});

	it('propose la clôture avec motif obligatoire pour un rôle qualité', async () => {
		renderTable([alerte()], 'quality');
		const motif = page.getByPlaceholder('Motif de clôture');
		await expect.element(motif).toBeInTheDocument();
		await expect.element(motif).toHaveAttribute('required');
		await expect.element(motif).toHaveAttribute('minlength', '3');
		await expect.element(page.getByRole('button', { name: 'Clôturer' })).toBeInTheDocument();
	});

	it('refuse la clôture aux opérateurs (séparation des tâches)', async () => {
		renderTable([alerte()], 'operator');
		await expect.element(page.getByPlaceholder('Motif de clôture')).not.toBeInTheDocument();
		await expect.element(page.getByText(/clôture d'une alerte froid/i)).toBeInTheDocument();
	});

	it('signale un lot non levable avec son motif', async () => {
		renderTable([
			alerte({
				lotsImpactes: [
					{
						id: 'lot-nc',
						produit: 'Crème',
						levable: false,
						motifBlocage: 'contrôle non conforme'
					}
				]
			})
		]);
		await expect.element(page.getByText(/non levable/i)).toBeInTheDocument();
		await expect.element(page.getByText(/contrôle non conforme/i)).toBeInTheDocument();
	});
});
