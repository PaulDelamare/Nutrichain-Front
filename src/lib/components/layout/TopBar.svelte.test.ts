import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import TopBar from './TopBar.svelte';

function renderTopBar() {
	render(TopBar, {
		props: { title: 'Tableau de bord', coldAlerts: null }
	} as unknown as SvelteComponentOptions<typeof TopBar>);
}

describe('TopBar — déconnexion', () => {
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

describe('TopBar — alerte froid', () => {
	function renderWithAlerts(coldAlerts: number | null) {
		render(TopBar, {
			props: { title: 'Tableau de bord', coldAlerts }
		} as unknown as SvelteComponentOptions<typeof TopBar>);
	}

	it('mène au listing de la chaîne du froid quand il y a des alertes', async () => {
		renderWithAlerts(3);

		const lien = page.getByRole('link', { name: /alertes? froid/ });
		await expect.element(lien).toHaveAttribute('href', '/chaine-du-froid');
	});

	it('n’affiche aucun lien d’alerte sans alerte', () => {
		renderWithAlerts(null);
		expect(document.querySelector('a[href*="chaine-du-froid"]')).toBeNull();
	});
});
