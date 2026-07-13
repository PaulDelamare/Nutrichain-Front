import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import Page from './(app)/tableau-de-bord/+page.svelte';
import { PAGE_SEARCH_KEY, PageSearchContext } from '$lib/context/pageSearch.svelte';
import { buildDashboardCharts } from '$lib/utils/org/dashboardCharts';

// La page lit $page.url hors runtime SvelteKit : on fournit un store minimal.
vi.mock('$app/stores', async () => {
	const { readable } = await import('svelte/store');
	return {
		page: readable({ url: new URL('http://localhost/tableau-de-bord') })
	};
});

function renderDashboard() {
	// Cast : le type de render() exige `target` avec la forme {props, context},
	// mais le runtime l'injecte lui-même (limitation vitest-browser-svelte).
	render(Page, {
		props: {
			data: {
				user: { id: 'u-test', name: 'Test', email: 'test@nutrichain.fr' },
				kpis: [],
				charts: buildDashboardCharts([], [], [], []),
				recentEvents: [],
				tasks: []
			}
		},
		context: new Map([[PAGE_SEARCH_KEY, new PageSearchContext()]])
	} as unknown as SvelteComponentOptions<typeof Page>);
}

describe('/tableau-de-bord', () => {
	it('affiche le titre de section', async () => {
		renderDashboard();

		const heading = page.getByRole('heading', { level: 2, name: "Vue d'ensemble" });
		await expect.element(heading).toBeInTheDocument();
	});

	it('annonce l’absence de données au lieu d’en inventer', async () => {
		renderDashboard();

		await expect.element(page.getByText('Aucun mouvement enregistré.')).toBeInTheDocument();
		await expect.element(page.getByText('Rien à traiter.')).toBeInTheDocument();
	});
});
