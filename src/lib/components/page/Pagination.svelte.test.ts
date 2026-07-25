import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import Pagination from './Pagination.svelte';

const monter = (props: Record<string, unknown>) =>
	render(Pagination, {
		props: { unit: 'lots', hrefFor: (n: number) => `/recherche-lots?page=${n}`, ...props }
	} as unknown as SvelteComponentOptions<typeof Pagination>);

describe('Pagination', () => {
	/**
	 * ⚠️ Le total est ce qui distingue « il n'y a que ces lots » de « on ne t'en montre qu'une
	 * partie ». Sans lui, une liste tronquée passe pour complète et un lot bien réel pour inexistant.
	 */
	it('annonce le total, pas seulement la page en cours', async () => {
		monter({ page: 2, totalPages: 7, total: 342 });

		await expect.element(page.getByText('Page 2 sur 7 · 342 lots')).toBeInTheDocument();
	});

	it('mène à la page précédente et à la suivante', async () => {
		monter({ page: 2, totalPages: 7, total: 342 });

		await expect
			.element(page.getByRole('link', { name: 'Précédent' }))
			.toHaveAttribute('href', '/recherche-lots?page=1');
		await expect
			.element(page.getByRole('link', { name: 'Suivant' }))
			.toHaveAttribute('href', '/recherche-lots?page=3');
	});

	it('neutralise « Précédent » sur la première page', async () => {
		monter({ page: 1, totalPages: 7, total: 342 });

		await expect
			.element(page.getByRole('link', { name: 'Précédent' }))
			.toHaveAttribute('aria-disabled', 'true');
		await expect
			.element(page.getByRole('link', { name: 'Suivant' }))
			.toHaveAttribute('aria-disabled', 'false');
	});

	it('neutralise « Suivant » sur la dernière page', async () => {
		monter({ page: 7, totalPages: 7, total: 342 });

		await expect
			.element(page.getByRole('link', { name: 'Suivant' }))
			.toHaveAttribute('aria-disabled', 'true');
	});

	it('affiche le décompte sans navigation quand tout tient sur une page', async () => {
		monter({ page: 1, totalPages: 1, total: 12 });

		await expect.element(page.getByText('12 lots')).toBeInTheDocument();
		expect(document.querySelectorAll('a')).toHaveLength(0);
	});

	it('reste muet quand il n’y a rien à compter', async () => {
		monter({ page: 1, totalPages: 0, total: 0 });

		expect(document.body.textContent?.trim()).toBe('');
	});
});
