import { describe, it, expect } from 'vitest';
import { suppliersPageSizeParams, suppliersSearchParams } from './suppliersSearchParams';
import { emptySupplierFilters } from '$lib/types/supplier';

const params = (init = '') => new URLSearchParams(init);

describe('suppliersSearchParams', () => {
	it('garde tab=suppliers et ne pose aucun filtre quand tout est vide / « tous »', () => {
		expect(suppliersSearchParams(params(), emptySupplierFilters()).toString()).toBe(
			'tab=suppliers'
		);
	});

	it('ignore un nom de moins de 3 caractères, le pose dès 3 (trimé)', () => {
		expect(
			suppliersSearchParams(params(), { ...emptySupplierFilters(), nom: 'au' }).has('nom')
		).toBe(false);
		expect(
			suppliersSearchParams(params(), { ...emptySupplierFilters(), nom: '  aubépines ' }).get('nom')
		).toBe('aubépines');
	});

	it('pose le statut sauf la sentinelle « tous »', () => {
		expect(
			suppliersSearchParams(params(), { ...emptySupplierFilters(), statut: 'archive' }).get('statut')
		).toBe('archive');
		expect(
			suppliersSearchParams(params(), { ...emptySupplierFilters(), statut: 'tous' }).has('statut')
		).toBe(false);
	});

	it('remet la pagination à la première page (retire page)', () => {
		const out = suppliersSearchParams(params('tab=suppliers&page=4'), {
			...emptySupplierFilters(),
			statut: 'actif'
		});
		expect(out.has('page')).toBe(false);
	});
});

describe('suppliersPageSizeParams', () => {
	it('pose la taille, garde l’onglet et repart en première page', () => {
		const out = suppliersPageSizeParams(params('tab=suppliers&page=5&statut=actif'), 50);
		expect(out.get('limit')).toBe('50');
		expect(out.get('tab')).toBe('suppliers');
		expect(out.has('page')).toBe(false);
		expect(out.get('statut')).toBe('actif');
	});
});
