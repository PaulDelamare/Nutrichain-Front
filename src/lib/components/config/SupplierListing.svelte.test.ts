import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { readable } from 'svelte/store';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import SupplierListing from './SupplierListing.svelte';
import type { ApiSupplierComplet, ApiSupplierList } from '$lib/Api/organization.server';
import type { KnownRole } from '$lib/config/roles';

// Composant piloté par l'URL : on fige un `$page` (la navigation reste inerte, les tests ne la
// déclenchent pas). On préserve les autres exports des modules `$app/*`.
vi.mock('$app/stores', async (orig) => ({
	...(await orig<Record<string, unknown>>()),
	page: readable({ url: new URL('http://test/configuration?tab=suppliers') })
}));

function sup(partial: Partial<ApiSupplierComplet> = {}): ApiSupplierComplet {
	return {
		id: 's1',
		nom_ferme: 'Ferme des Aubépines',
		adresse_siege: '12 route des Champs',
		type_produit: 'Produits laitiers',
		contact_qualite: null,
		is_active: true,
		...partial
	};
}

function list(rows: ApiSupplierComplet[]): ApiSupplierList {
	return {
		data: rows,
		pagination: { page: 1, limit: 25, total: rows.length, totalPages: 1 }
	};
}

function renderListing(rows: ApiSupplierComplet[], role: KnownRole = 'admin') {
	render(SupplierListing, {
		props: {
			suppliers: list(rows),
			filters: { nom: '', statut: 'tous' },
			pageSize: 25,
			pageSizeOptions: [10, 25, 50, 100],
			role,
			form: null
		}
	} as unknown as SvelteComponentOptions<typeof SupplierListing>);
}

describe('SupplierListing', () => {
	it('dit clairement que rien ne correspond plutôt que d’afficher un tableau vide', async () => {
		renderListing([]);
		await expect
			.element(page.getByText('Aucun fournisseur ne correspond aux filtres.'))
			.toBeInTheDocument();
	});

	it('affiche le nom et remplace un type de produit absent par un tiret', async () => {
		renderListing([sup({ nom_ferme: 'GAEC du Val', type_produit: null })]);
		await expect.element(page.getByText('GAEC du Val')).toBeInTheDocument();
		await expect.element(page.getByText('—')).toBeInTheDocument();
	});

	it('n’offre ni ajout ni édition à un rôle en lecture seule', async () => {
		renderListing([sup()], 'viewer');
		expect(page.getByRole('button', { name: 'Ajouter un fournisseur' }).elements()).toHaveLength(0);
		expect(page.getByRole('button', { name: 'Éditer' }).elements()).toHaveLength(0);
	});

	it('ouvre la modale de création', async () => {
		renderListing([sup()]);
		await page.getByRole('button', { name: 'Ajouter un fournisseur' }).click();
		await expect.element(page.getByRole('button', { name: 'Ajouter' })).toBeInTheDocument();
	});

	it('ouvre la modale d’édition préremplie depuis la ligne', async () => {
		renderListing([sup({ nom_ferme: 'Ferme Bio', type_produit: 'Légumes' })]);
		await page.getByRole('button', { name: 'Éditer' }).click();
		await expect.element(page.getByRole('button', { name: 'Enregistrer' })).toBeInTheDocument();
		await expect.element(page.getByPlaceholder('Ex. : Produits laitiers')).toHaveValue('Légumes');
	});
});
