import { describe, it, expect } from 'vitest';
import { locationsPageSizeParams, locationsSearchParams } from './locationsSearchParams';
import { emptyLocationFilters } from '$lib/types/location';

const params = (init = '') => new URLSearchParams(init);

describe('locationsSearchParams', () => {
	it('garde tab=locations et ne pose aucun filtre quand tout est vide / « tous »', () => {
		expect(locationsSearchParams(params(), emptyLocationFilters()).toString()).toBe(
			'tab=locations'
		);
	});

	it('ignore un nom de moins de 3 caractères, le pose dès 3 (trimé)', () => {
		expect(
			locationsSearchParams(params(), { ...emptyLocationFilters(), nom: 'ch' }).has('nom')
		).toBe(false);
		expect(
			locationsSearchParams(params(), { ...emptyLocationFilters(), nom: '  chambre ' }).get('nom')
		).toBe('chambre');
	});

	it('pose le statut sauf la sentinelle « tous »', () => {
		expect(
			locationsSearchParams(params(), { ...emptyLocationFilters(), statut: 'archive' }).get(
				'statut'
			)
		).toBe('archive');
		expect(
			locationsSearchParams(params(), { ...emptyLocationFilters(), statut: 'tous' }).has('statut')
		).toBe(false);
	});

	it('remet la pagination à la première page (retire page)', () => {
		const out = locationsSearchParams(params('tab=locations&page=4'), {
			...emptyLocationFilters(),
			statut: 'actif'
		});
		expect(out.has('page')).toBe(false);
	});
});

describe('locationsPageSizeParams', () => {
	it('pose la taille, garde l’onglet et repart en première page', () => {
		const out = locationsPageSizeParams(params('tab=locations&page=5&statut=actif'), 50);
		expect(out.get('limit')).toBe('50');
		expect(out.get('tab')).toBe('locations');
		expect(out.has('page')).toBe(false);
		expect(out.get('statut')).toBe('actif');
	});
});
