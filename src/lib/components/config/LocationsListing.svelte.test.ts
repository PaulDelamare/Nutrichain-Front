import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { readable } from 'svelte/store';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import LocationsListing from './LocationsListing.svelte';
import type { ApiLocation, ApiLocationList } from '$lib/Api/organization.server';
import type { KnownRole } from '$lib/config/roles';

// Composant piloté par l'URL : on fige un `$page` (la navigation reste inerte, les tests ne la
// déclenchent pas). On préserve les autres exports des modules `$app/*`.
vi.mock('$app/stores', async (orig) => ({
	...(await orig<Record<string, unknown>>()),
	page: readable({ url: new URL('http://test/configuration?tab=locations') })
}));

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

function list(rows: ApiLocation[]): ApiLocationList {
	return {
		data: rows,
		pagination: { page: 1, limit: 25, total: rows.length, totalPages: 1 }
	};
}

function renderListing(rows: ApiLocation[], role: KnownRole = 'admin') {
	render(LocationsListing, {
		props: {
			locations: list(rows),
			filters: { nom: '', statut: 'tous' },
			pageSize: 25,
			pageSizeOptions: [10, 25, 50, 100],
			role,
			form: null
		}
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
		await expect.element(page.getByRole('button', { name: 'Ajouter' })).toBeInTheDocument();
		await expect.element(page.getByPlaceholder('2.286540')).toBeInTheDocument();
	});

	it('ouvre la modale d’édition préremplie depuis la ligne', async () => {
		renderListing([loc({ nom: 'Quai central', type: 'Réception', latitude: 48.83291 })]);
		await page.getByRole('button', { name: 'Éditer' }).click();
		await expect.element(page.getByRole('button', { name: 'Enregistrer' })).toBeInTheDocument();
		await expect.element(page.getByPlaceholder('Ex. : Chambre froide')).toHaveValue('Réception');
		await expect.element(page.getByPlaceholder('48.832910')).toHaveValue(48.83291);
	});
});
