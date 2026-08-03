import { describe, it, expect } from 'vitest';
import { customersPageSizeParams, customersSearchParams } from './customersSearchParams';
import { emptyCustomerFilters } from '$lib/types/customer';

const params = (init = '') => new URLSearchParams(init);

describe('customersSearchParams', () => {
	it('garde tab=customers et ne pose aucun filtre quand tout est vide / « tous »', () => {
		expect(customersSearchParams(params(), emptyCustomerFilters()).toString()).toBe(
			'tab=customers'
		);
	});

	it('ignore un nom de moins de 3 caractères, le pose dès 3 (trimé)', () => {
		expect(
			customersSearchParams(params(), { ...emptyCustomerFilters(), nom: 'su' }).has('nom')
		).toBe(false);
		expect(
			customersSearchParams(params(), { ...emptyCustomerFilters(), nom: '  super u ' }).get('nom')
		).toBe('super u');
	});

	it('pose le statut sauf la sentinelle « tous »', () => {
		expect(
			customersSearchParams(params(), { ...emptyCustomerFilters(), statut: 'archive' }).get('statut')
		).toBe('archive');
		expect(
			customersSearchParams(params(), { ...emptyCustomerFilters(), statut: 'tous' }).has('statut')
		).toBe(false);
	});

	it('remet la pagination à la première page (retire page)', () => {
		const out = customersSearchParams(params('tab=customers&page=4'), {
			...emptyCustomerFilters(),
			statut: 'actif'
		});
		expect(out.has('page')).toBe(false);
	});
});

describe('customersPageSizeParams', () => {
	it('pose la taille, garde l’onglet et repart en première page', () => {
		const out = customersPageSizeParams(params('tab=customers&page=5&statut=actif'), 50);
		expect(out.get('limit')).toBe('50');
		expect(out.get('tab')).toBe('customers');
		expect(out.has('page')).toBe(false);
		expect(out.get('statut')).toBe('actif');
	});
});
