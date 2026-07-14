import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import TopBar from './TopBar.svelte';
import { PAGE_SEARCH_KEY, PageSearchContext } from '$lib/context/pageSearch.svelte';

function renderTopBar() {
	render(TopBar, {
		props: { title: 'Tableau de bord', coldAlerts: null },
		context: new Map([[PAGE_SEARCH_KEY, new PageSearchContext()]])
	} as unknown as SvelteComponentOptions<typeof TopBar>);
}

describe('TopBar — déconnexion', () => {
	// Un `<a>` est préchargé au survol (app.html : data-sveltekit-preload-data="hover") :
	// la déconnexion doit être une soumission, jamais une navigation.
	it('déconnecte par un bouton de formulaire, pas par un lien', async () => {
		renderTopBar();

		const bouton = page.getByRole('button', { name: 'Déconnexion' });
		await expect.element(bouton).toBeInTheDocument();
		await expect.element(bouton).toHaveAttribute('type', 'submit');

		expect(document.querySelector('a[href*="deconnexion"]')).toBeNull();
	});

	it('poste explicitement vers /deconnexion — sans `action`, le POST partirait sur la page courante (405)', async () => {
		renderTopBar();

		await expect.element(page.getByRole('button', { name: 'Déconnexion' })).toBeInTheDocument();

		const form = document.querySelector('form');
		expect(form?.getAttribute('method')?.toLowerCase()).toBe('post');
		expect(form?.getAttribute('action')).toContain('/deconnexion');
	});
});
