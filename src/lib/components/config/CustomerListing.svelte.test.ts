import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { readable } from 'svelte/store';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import CustomerListing from './CustomerListing.svelte';
import type { ApiCustomerComplet, ApiCustomerList } from '$lib/Api/organization.server';
import type { KnownRole } from '$lib/config/roles';

// Composant piloté par l'URL : on fige un `$page` (la navigation reste inerte, les tests ne la
// déclenchent pas). On préserve les autres exports des modules `$app/*`.
vi.mock('$app/stores', async (orig) => ({
	...(await orig<Record<string, unknown>>()),
	page: readable({ url: new URL('http://test/configuration?tab=customers') })
}));

function cust(partial: Partial<ApiCustomerComplet> = {}): ApiCustomerComplet {
	return {
		id: 'c1',
		nom_enseigne: 'Super U Rennes',
		adresse_livraison: '3 avenue de la Gare',
		email: 'contact@superu.fr',
		contact_urgence: null,
		notes: null,
		is_active: true,
		...partial
	};
}

function list(rows: ApiCustomerComplet[]): ApiCustomerList {
	return {
		data: rows,
		pagination: { page: 1, limit: 25, total: rows.length, totalPages: 1 }
	};
}

function renderListing(rows: ApiCustomerComplet[], role: KnownRole = 'admin') {
	render(CustomerListing, {
		props: {
			customers: list(rows),
			filters: { nom: '', statut: 'tous' },
			pageSize: 25,
			pageSizeOptions: [10, 25, 50, 100],
			role,
			form: null
		}
	} as unknown as SvelteComponentOptions<typeof CustomerListing>);
}

describe('CustomerListing', () => {
	it('dit clairement que rien ne correspond plutôt que d’afficher un tableau vide', async () => {
		renderListing([]);
		await expect
			.element(page.getByText('Aucun client ne correspond aux filtres.'))
			.toBeInTheDocument();
	});

	it('affiche l’enseigne et remplace un e-mail absent par un tiret', async () => {
		renderListing([cust({ nom_enseigne: 'Biocoop Nantes', email: null })]);
		await expect.element(page.getByText('Biocoop Nantes')).toBeInTheDocument();
		await expect.element(page.getByText('—')).toBeInTheDocument();
	});

	it('n’offre ni ajout ni édition à un rôle en lecture seule', async () => {
		renderListing([cust()], 'viewer');
		expect(page.getByRole('button', { name: 'Ajouter un client' }).elements()).toHaveLength(0);
		expect(page.getByRole('button', { name: 'Éditer' }).elements()).toHaveLength(0);
	});

	it('ouvre la modale de création', async () => {
		renderListing([cust()]);
		await page.getByRole('button', { name: 'Ajouter un client' }).click();
		await expect.element(page.getByRole('button', { name: 'Ajouter' })).toBeInTheDocument();
	});

	it('ouvre la modale d’édition préremplie depuis la ligne', async () => {
		renderListing([cust({ nom_enseigne: 'Carrefour City', email: 'city@carrefour.fr' })]);
		await page.getByRole('button', { name: 'Éditer' }).click();
		await expect.element(page.getByRole('button', { name: 'Enregistrer' })).toBeInTheDocument();
		await expect.element(page.getByRole('textbox', { name: 'E-mail (facultatif)' })).toHaveValue(
			'city@carrefour.fr'
		);
	});
});
