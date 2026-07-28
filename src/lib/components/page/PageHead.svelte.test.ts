import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import PageHead from './PageHead.svelte';

const monter = (props: Record<string, unknown>) =>
	render(PageHead, { props } as unknown as SvelteComponentOptions<typeof PageHead>);

describe('PageHead', () => {
	it('affiche le titre et la description de la page', async () => {
		monter({ heading: 'Arbre de traçabilité', description: 'Origine et descendance d’un lot.' });

		await expect
			.element(page.getByRole('heading', { level: 2 }))
			.toHaveTextContent('Arbre de traçabilité');
		await expect.element(page.getByText('Origine et descendance d’un lot.')).toBeInTheDocument();
	});

	/**
	 * #81 — `document.title` était vide sur toute l'application : un présentateur qui ouvre la
	 * traçabilité, la fiche lot et les rappels dans trois onglets ne les distingue plus.
	 *
	 * Le titre est composé ici plutôt que page par page : l'intitulé est déjà passé au composant, le
	 * répéter dans un `<svelte:head>` de chaque écran, c'est vingt occasions de le laisser diverger.
	 */
	it('renseigne le titre du document à partir de l’intitulé (#81)', async () => {
		monter({ heading: 'Fiche lot 260726-IXWL0H' });

		await expect.poll(() => document.title).toBe('Fiche lot 260726-IXWL0H — NutriChain');
	});
});
