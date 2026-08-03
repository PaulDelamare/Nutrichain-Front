import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { readable } from 'svelte/store';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import ProductListing from './ProductListing.svelte';
import type { ApiProductComplet, ApiProductList } from '$lib/Api/organization.server';
import type { KnownRole } from '$lib/config/roles';

// Composant piloté par l'URL : on fige un `$page` (la navigation reste inerte, les tests ne la
// déclenchent pas). On préserve les autres exports des modules `$app/*`.
vi.mock('$app/stores', async (orig) => ({
	...(await orig<Record<string, unknown>>()),
	page: readable({ url: new URL('http://test/configuration?tab=products') })
}));

function prod(partial: Partial<ApiProductComplet> = {}): ApiProductComplet {
	return {
		id: 'p1',
		nom: 'Yaourt nature 125g',
		code_gtin: '3456789012345',
		categorie: 'Frais',
		duree_conservation_defaut: 30,
		seuil_alerte_stock: 10,
		unite_reference: 'KG',
		is_active: true,
		...partial
	};
}

function list(rows: ApiProductComplet[]): ApiProductList {
	return {
		data: rows,
		pagination: { page: 1, limit: 25, total: rows.length, totalPages: 1 }
	};
}

function renderListing(rows: ApiProductComplet[], role: KnownRole = 'admin') {
	render(ProductListing, {
		props: {
			products: list(rows),
			filters: { nom: '', gtin: '', statut: 'tous' },
			pageSize: 25,
			pageSizeOptions: [10, 25, 50, 100],
			role,
			form: null
		}
	} as unknown as SvelteComponentOptions<typeof ProductListing>);
}

describe('ProductListing', () => {
	it('dit clairement que rien ne correspond plutôt que d’afficher un tableau vide', async () => {
		renderListing([]);
		await expect
			.element(page.getByText('Aucun produit ne correspond aux filtres.'))
			.toBeInTheDocument();
	});

	it('affiche le nom, le GTIN et la catégorie', async () => {
		renderListing([
			prod({ nom: 'Beurre doux', code_gtin: '3011111111111', categorie: 'Crémerie' })
		]);
		await expect.element(page.getByText('Beurre doux')).toBeInTheDocument();
		await expect.element(page.getByRole('cell', { name: '3011111111111' })).toBeInTheDocument();
		await expect.element(page.getByRole('cell', { name: 'Crémerie' })).toBeInTheDocument();
	});

	it('offre un filtre GTIN dans la barre de filtres', async () => {
		renderListing([prod()]);
		await expect.element(page.getByRole('textbox', { name: 'GTIN' })).toBeInTheDocument();
	});

	it('n’offre ni ajout ni édition à un rôle en lecture seule', async () => {
		renderListing([prod()], 'viewer');
		expect(page.getByRole('button', { name: 'Ajouter un produit' }).elements()).toHaveLength(0);
		expect(page.getByRole('button', { name: 'Éditer' }).elements()).toHaveLength(0);
	});

	it('propose le GTIN et l’unité à la création', async () => {
		renderListing([prod()]);
		await page.getByRole('button', { name: 'Ajouter un produit' }).click();
		await expect.element(page.getByRole('button', { name: 'Ajouter' })).toBeInTheDocument();
		await expect
			.element(page.getByRole('textbox', { name: 'Code GTIN (8 à 14 chiffres)' }))
			.toBeInTheDocument();
	});

	it('n’édite ni GTIN ni unité (identité GS1), mais préremplit conservation et seuil', async () => {
		renderListing([prod({ duree_conservation_defaut: 45, seuil_alerte_stock: 7 })]);
		await page.getByRole('button', { name: 'Éditer' }).click();
		await expect.element(page.getByRole('button', { name: 'Enregistrer' })).toBeInTheDocument();
		expect(
			page.getByRole('textbox', { name: 'Code GTIN (8 à 14 chiffres)' }).elements()
		).toHaveLength(0);
		await expect
			.element(page.getByRole('spinbutton', { name: 'Conservation (jours)' }))
			.toHaveValue(45);
	});
});
