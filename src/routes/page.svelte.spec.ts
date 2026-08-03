import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import Page from './(app)/tableau-de-bord/+page.svelte';
import { buildDashboardCharts } from '$lib/utils/org/dashboardCharts';

vi.mock('$app/stores', async () => {
	const { readable } = await import('svelte/store');
	return {
		page: readable({ url: new URL('http://localhost:5173/tableau-de-bord') })
	};
});

function renderDashboard() {
	render(Page, {
		props: {
			data: {
				user: { id: 'u-test', name: 'Test', email: 'test@nutrichain.fr' },
				kpis: [],
				charts: buildDashboardCharts([], [], [], []),
				recentActivity: [],
				tasks: []
			}
		}
	} as unknown as SvelteComponentOptions<typeof Page>);
}

describe('/tableau-de-bord', () => {
	it('affiche le titre de section', async () => {
		renderDashboard();

		const heading = page.getByRole('heading', { level: 2, name: "Vue d'ensemble" });
		await expect.element(heading).toBeInTheDocument();
	});

	/**
	 * #83 — Les deux panneaux alimentés par  s'annonçaient « EPCIS » (« Activité
	 * récente (EPCIS) », « 7 derniers jours — événements EPCIS ») alors qu'ils affichent des
	 * . L'écran revendiquait une conformité que le back n'a pas, sur l'argument
	 * central du projet. Le journal EPCIS, lui, garde son vocabulaire : il montre de vrais événements.
	 */
	it('ne revendique pas EPCIS sur les panneaux alimentés par les mouvements', async () => {
		renderDashboard();

		await expect
			.element(page.getByRole('heading', { name: 'Activité récente' }))
			.toBeInTheDocument();
		await expect.element(page.getByText(/EPCIS/)).not.toBeInTheDocument();
	});

	it('annonce l’absence de données au lieu d’en inventer', async () => {
		renderDashboard();

		await expect.element(page.getByText('Aucun mouvement enregistré.')).toBeInTheDocument();
		await expect.element(page.getByText('Rien à traiter.')).toBeInTheDocument();
	});
});
