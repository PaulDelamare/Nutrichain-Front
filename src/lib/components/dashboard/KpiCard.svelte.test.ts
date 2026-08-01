import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import KpiCard from './KpiCard.svelte';

describe('KpiCard', () => {
	// L'indicateur doit mener à sa page et porter sa couleur de contour (data-accent pilote le CSS).
	it('est un lien vers sa destination, avec la couleur d’accent demandée', async () => {
		render(KpiCard, {
			props: {
				label: 'Lots suivis',
				value: '8',
				detail: 'Catalogue organisation active',
				href: '/recherche-lots',
				accent: 'green'
			}
		} as unknown as SvelteComponentOptions<typeof KpiCard>);

		const link = page.getByRole('link', { name: /Lots suivis/ });
		await expect.element(link).toHaveAttribute('href', '/recherche-lots');
		await expect.element(link).toHaveAttribute('data-accent', 'green');
	});
});
