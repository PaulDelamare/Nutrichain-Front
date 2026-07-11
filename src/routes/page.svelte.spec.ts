import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
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
		render(Page, {
			props: {
				data: {
					source: 'mock' as const,
					kpis: mockKpis,
					charts: buildDashboardCharts([], [], [], [], true),
					recentEvents: mockEvents,
					tasks: mockTasks
				}
			},
			context: new Map([[PAGE_SEARCH_KEY, new PageSearchContext()]])
		});

		const heading = page.getByRole('heading', { level: 2, name: "Vue d'ensemble" });
		await expect.element(heading).toBeInTheDocument();
	});
});
