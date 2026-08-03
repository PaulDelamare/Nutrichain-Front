import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { readable } from 'svelte/store';
import { render, type SvelteComponentOptions } from 'vitest-browser-svelte';
import EquipmentListing from './EquipmentListing.svelte';
import type { ApiEquipment, ApiEquipmentList, ApiLocation } from '$lib/Api/organization.server';
import type { KnownRole } from '$lib/config/roles';

// Composant piloté par l'URL : on fige un `$page` (la navigation reste inerte, les tests ne la
// déclenchent pas). On préserve les autres exports des modules `$app/*`.
vi.mock('$app/stores', async (orig) => ({
	...(await orig<Record<string, unknown>>()),
	page: readable({ url: new URL('http://test/configuration?tab=equipment') })
}));

function eq(partial: Partial<ApiEquipment> = {}): ApiEquipment {
	return {
		id: 'eq1',
		nom: 'Frigo réception A',
		type: 'FRIGO',
		statut: 'PRET',
		sensor_id: null,
		temp_actuelle: null,
		temp_seuil_max: 4,
		lieu: { nom: 'Quai de réception' },
		...partial
	};
}

function list(rows: ApiEquipment[]): ApiEquipmentList {
	return {
		data: rows,
		pagination: { page: 1, limit: 25, total: rows.length, totalPages: 1 }
	};
}

const LOCS: ApiLocation[] = [{ id: 'l1', nom: 'Quai de réception', type: null, is_active: true }];

function renderListing(
	rows: ApiEquipment[],
	role: KnownRole = 'admin',
	activeLocations: ApiLocation[] = LOCS
) {
	render(EquipmentListing, {
		props: {
			equipment: list(rows),
			filters: { nom: '', type: 'tous' },
			activeLocations,
			pageSize: 25,
			pageSizeOptions: [10, 25, 50, 100],
			role,
			form: null
		}
	} as unknown as SvelteComponentOptions<typeof EquipmentListing>);
}

describe('EquipmentListing', () => {
	it('dit clairement que rien ne correspond plutôt que d’afficher un tableau vide', async () => {
		renderListing([]);
		await expect
			.element(page.getByText('Aucun matériel ne correspond aux filtres.'))
			.toBeInTheDocument();
	});

	it('traduit le type, affiche l’emplacement et un lien vers l’étiquette QR', async () => {
		renderListing([eq({ nom: 'Cellule 12', type: 'CONGELATEUR' })]);
		await expect.element(page.getByText('Cellule 12')).toBeInTheDocument();
		await expect
			.element(page.getByRole('cell', { name: 'Congélateur', exact: true }))
			.toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: 'Étiquette QR' })).toBeInTheDocument();
	});

	it('n’offre pas la création à un rôle en lecture seule', async () => {
		renderListing([eq()], 'viewer');
		expect(page.getByRole('button', { name: 'Ajouter un matériel' }).elements()).toHaveLength(0);
	});

	it('invite à créer un emplacement quand aucun emplacement actif n’existe', async () => {
		renderListing([], 'admin', []);
		await expect
			.element(
				page.getByText("Créez d'abord un emplacement actif pour pouvoir ajouter du matériel.")
			)
			.toBeInTheDocument();
		expect(page.getByRole('button', { name: 'Ajouter un matériel' }).elements()).toHaveLength(0);
	});

	it('ouvre la modale de création avec le sélecteur d’emplacement', async () => {
		renderListing([eq()]);
		await page.getByRole('button', { name: 'Ajouter un matériel' }).click();
		await expect.element(page.getByRole('button', { name: 'Ajouter' })).toBeInTheDocument();
		await expect.element(page.getByRole('combobox', { name: 'Emplacement' })).toBeInTheDocument();
	});
});
