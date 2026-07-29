import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import HorizontalBarChart from './HorizontalBarChart.svelte';

/**
 * Le tableau de bord se rendait avec des données VIDES dans les tests existants : le graphique
 * n'avait donc jamais deux segments à afficher, et le défaut ci-dessous est passé inaperçu jusqu'à
 * ce qu'on ouvre la page dans un vrai navigateur.
 */
describe('HorizontalBarChart', () => {
	it('affiche une barre par segment', async () => {
		render(HorizontalBarChart, {
			props: {
				segments: [
					{ label: 'Critique', value: 8, color: '#b3261e' },
					{ label: 'Modéré', value: 3, color: '#a76e07' }
				]
			}
		} as unknown as SvelteComponentOptions<typeof HorizontalBarChart>);

		await expect.element(page.getByText('Modéré')).toBeInTheDocument();
	});

	// Deux alertes peuvent légitimement porter le même nom. Le bloc `each` était keyé sur le
	// libellé : Svelte levait `each_key_duplicate`, et l'exception remontait jusqu'au layout —
	// la barre latérale du tableau de bord disparaissait entièrement (#89).
	it('supporte deux segments de MEME libelle sans casser le rendu', async () => {
		render(HorizontalBarChart, {
			props: {
				segments: [
					{ label: 'Critique', value: 8, color: '#b3261e' },
					{ label: 'Critique', value: 1, color: '#e0a53c' }
				]
			}
		} as unknown as SvelteComponentOptions<typeof HorizontalBarChart>);

		await expect.element(page.getByText('8')).toBeInTheDocument();
		await expect.element(page.getByText('1')).toBeInTheDocument();
	});

	it('annonce l absence de donnees au lieu d afficher un graphique vide', async () => {
		render(HorizontalBarChart, { props: { segments: [] } } as unknown as SvelteComponentOptions<
			typeof HorizontalBarChart
		>);

		await expect.element(page.getByText('Aucune donnée.')).toBeInTheDocument();
	});
});
