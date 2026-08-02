import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import LocationsListing from './LocationsListing.svelte';
import type { ApiLocation } from '$lib/Api/organization.server';
import type { KnownRole } from '$lib/config/roles';

function loc(partial: Partial<ApiLocation> = {}): ApiLocation {
	return {
		id: 'l1',
		nom: 'Chambre froide A',
		type: 'Chambre froide',
		description: null,
		latitude: 48.83291,
		longitude: 2.28654,
		is_active: true,
		...partial
	};
}

function renderListing(locations: ApiLocation[], role: KnownRole = 'admin') {
	render(LocationsListing, {
		props: { locations, role, form: null }
	} as unknown as SvelteComponentOptions<typeof LocationsListing>);
}

describe('LocationsListing', () => {
	it('dit clairement que rien ne correspond plutôt que d’afficher un tableau vide', async () => {
		renderListing([]);
		await expect
			.element(page.getByText('Aucun emplacement ne correspond aux filtres.'))
			.toBeInTheDocument();
	});

	it('affiche le nom et remplace un type absent par un tiret', async () => {
		renderListing([loc({ nom: 'Quai de réception', type: null })]);
		await expect.element(page.getByText('Quai de réception')).toBeInTheDocument();
		await expect.element(page.getByText('—')).toBeInTheDocument();
	});

	it('n’offre ni ajout ni édition à un rôle en lecture seule', async () => {
		renderListing([loc()], 'viewer');
		expect(page.getByRole('button', { name: 'Ajouter un emplacement' }).elements()).toHaveLength(0);
		expect(page.getByRole('button', { name: 'Éditer' }).elements()).toHaveLength(0);
	});

	it('ouvre la modale de création avec la position intégrée', async () => {
		renderListing([loc()]);
		await page.getByRole('button', { name: 'Ajouter un emplacement' }).click();
		// Le bouton de soumission « Ajouter » n'existe que dans la modale ouverte.
		await expect.element(page.getByRole('button', { name: 'Ajouter' })).toBeInTheDocument();
		await expect.element(page.getByPlaceholder('2.286540')).toBeInTheDocument();
	});

	it('ouvre la modale d’édition préremplie depuis la ligne', async () => {
		renderListing([loc({ nom: 'Quai central', type: 'Réception', latitude: 48.83291 })]);
		await page.getByRole('button', { name: 'Éditer' }).click();
		await expect.element(page.getByRole('button', { name: 'Enregistrer' })).toBeInTheDocument();
		// Type et position sont préremplis depuis la ligne cliquée (même câblage que le nom).
		await expect.element(page.getByPlaceholder('Ex. : Chambre froide')).toHaveValue('Réception');
		await expect.element(page.getByPlaceholder('48.832910')).toHaveValue(48.83291);
	});
});
