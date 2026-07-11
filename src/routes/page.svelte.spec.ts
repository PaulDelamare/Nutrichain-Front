import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import Page from './(app)/tableau-de-bord/+page.svelte';
import { PAGE_SEARCH_KEY, PageSearchContext } from '$lib/context/pageSearch.svelte';
import { mockEvents, mockKpis, mockTasks } from '$lib/utils/org/mappers';
import { buildDashboardCharts } from '$lib/utils/org/dashboardCharts';

// La page lit $page.url hors runtime SvelteKit : on fournit un store minimal.
vi.mock('$app/stores', async () => {
	const { readable } = await import('svelte/store');
	return {
		page: readable({ url: new URL('http://localhost/tableau-de-bord') })
	};
});

describe('/tableau-de-bord', () => {
	it('affiche le titre de section', async () => {
		// Cast : le type de render() exige `target` avec la forme {props, context},
		// mais le runtime l'injecte lui-même (limitation vitest-browser-svelte).
		render(Page, {
			props: {
				data: {
					user: { id: 'u-test', name: 'Test', email: 'test@nutrichain.fr' },
					source: 'mock' as const,
					kpis: mockKpis,
					charts: buildDashboardCharts([], [], [], [], true),
					recentEvents: mockEvents,
					tasks: mockTasks
				}
			},
			context: new Map([[PAGE_SEARCH_KEY, new PageSearchContext()]])
		} as unknown as SvelteComponentOptions<typeof Page>);

		const heading = page.getByRole('heading', { level: 2, name: "Vue d'ensemble" });
		await expect.element(heading).toBeInTheDocument();
	});
});
