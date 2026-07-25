import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import StatCard from './StatCard.svelte';
import Placeholder from '../page/Placeholder.svelte';

describe('StatCard', () => {
	it('affiche l’intitulé et sa valeur', async () => {
		render(StatCard, {
			props: { label: 'Lots suivis', value: '128' }
		} as unknown as SvelteComponentOptions<typeof StatCard>);

		await expect.element(page.getByText('Lots suivis')).toBeInTheDocument();
		await expect.element(page.getByText('128')).toBeInTheDocument();
	});

	it('accepte une mise en avant pour un chiffre qui appelle une action', async () => {
		render(StatCard, {
			props: { label: 'Lots en quarantaine', value: '3', accent: 'warn' }
		} as unknown as SvelteComponentOptions<typeof StatCard>);

		await expect.element(page.getByText('Lots en quarantaine')).toBeInTheDocument();
	});
});

describe('Placeholder', () => {
	it('reprend le message fourni par la page', async () => {
		render(Placeholder, {
			props: { message: 'Aucun rappel produit en cours.' }
		} as unknown as SvelteComponentOptions<typeof Placeholder>);

		await expect.element(page.getByText('Aucun rappel produit en cours.')).toBeInTheDocument();
	});

	it('affiche un texte par défaut plutôt qu’un cadre vide', async () => {
		render(Placeholder, { props: {} } as unknown as SvelteComponentOptions<typeof Placeholder>);
		await expect.element(page.getByText('Contenu à venir.')).toBeInTheDocument();
	});
});
