import { describe, it, expect } from 'vitest';
import { productsPageSizeParams, productsSearchParams } from './productsSearchParams';
import { emptyProductFilters } from '$lib/types/product';

const params = (init = '') => new URLSearchParams(init);

describe('productsSearchParams', () => {
	it('garde tab=products et ne pose aucun filtre quand tout est vide / « tous »', () => {
		expect(productsSearchParams(params(), emptyProductFilters()).toString()).toBe('tab=products');
	});

	it('ignore un nom de moins de 3 caractères, le pose dès 3 (trimé)', () => {
		expect(productsSearchParams(params(), { ...emptyProductFilters(), nom: 'ya' }).has('nom')).toBe(
			false
		);
		expect(
			productsSearchParams(params(), { ...emptyProductFilters(), nom: '  yaourt ' }).get('nom')
		).toBe('yaourt');
	});

	it('ignore un gtin de moins de 3 caractères, le pose dès 3 (trimé)', () => {
		expect(
			productsSearchParams(params(), { ...emptyProductFilters(), gtin: '34' }).has('gtin')
		).toBe(false);
		expect(
			productsSearchParams(params(), { ...emptyProductFilters(), gtin: '  3456789 ' }).get('gtin')
		).toBe('3456789');
	});

	it('pose le statut sauf la sentinelle « tous »', () => {
		expect(
			productsSearchParams(params(), { ...emptyProductFilters(), statut: 'archive' }).get('statut')
		).toBe('archive');
		expect(
			productsSearchParams(params(), { ...emptyProductFilters(), statut: 'tous' }).has('statut')
		).toBe(false);
	});

	it('remet la pagination à la première page (retire page)', () => {
		const out = productsSearchParams(params('tab=products&page=4'), {
			...emptyProductFilters(),
			statut: 'actif'
		});
		expect(out.has('page')).toBe(false);
	});
});

describe('productsPageSizeParams', () => {
	it('pose la taille, garde l’onglet et repart en première page', () => {
		const out = productsPageSizeParams(params('tab=products&page=5&statut=actif'), 50);
		expect(out.get('limit')).toBe('50');
		expect(out.get('tab')).toBe('products');
		expect(out.has('page')).toBe(false);
		expect(out.get('statut')).toBe('actif');
	});
});
