import { describe, it, expect } from 'vitest';
import { filterLocations } from './filterLocations';
import { emptyLocationFilters } from '$lib/types/location';
import type { ApiLocation } from '$lib/Api/organization.server';

function loc(partial: Partial<ApiLocation> = {}): ApiLocation {
	return {
		id: 'l1',
		nom: 'Chambre froide A',
		type: 'COLD_STORAGE',
		latitude: null,
		longitude: null,
		is_active: true,
		...partial
	};
}

describe('filterLocations', () => {
	it('ne retire rien sans filtre', () => {
		const rows = [loc(), loc({ id: 'l2', nom: 'Quai', type: 'RECEPTION' })];
		expect(filterLocations(rows, emptyLocationFilters())).toHaveLength(2);
	});

	it('ignore une recherche nom de moins de 3 caractères', () => {
		const rows = [loc({ nom: 'Chambre froide A' }), loc({ id: 'l2', nom: 'Quai' })];
		expect(filterLocations(rows, { ...emptyLocationFilters(), nom: 'Ch' })).toHaveLength(2);
	});

	it('filtre le nom dès 3 caractères, sans casse', () => {
		const rows = [loc({ nom: 'Chambre froide A' }), loc({ id: 'l2', nom: 'Quai' })];
		expect(filterLocations(rows, { ...emptyLocationFilters(), nom: 'chambre' })).toHaveLength(1);
	});

	it('filtre par type ; « tous » les garde ; un type absent (null) n’est jamais retenu par un type précis', () => {
		const rows = [
			loc({ type: 'COLD_STORAGE' }),
			loc({ id: 'l2', type: 'RECEPTION' }),
			loc({ id: 'l3', type: null })
		];
		expect(filterLocations(rows, { ...emptyLocationFilters(), type: 'tous' })).toHaveLength(3);
		expect(filterLocations(rows, { ...emptyLocationFilters(), type: 'RECEPTION' })).toHaveLength(1);
	});

	it('filtre par statut actif / archivé', () => {
		const rows = [loc({ is_active: true }), loc({ id: 'l2', is_active: false })];
		expect(filterLocations(rows, { ...emptyLocationFilters(), statut: 'actif' })).toHaveLength(1);
		expect(filterLocations(rows, { ...emptyLocationFilters(), statut: 'archive' })).toHaveLength(1);
	});
});
