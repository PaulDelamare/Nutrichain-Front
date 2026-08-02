import { describe, it, expect } from 'vitest';
import { lotsPageSizeParams, lotsSearchParams } from './lotsSearchParams';
import { emptyLotFilters } from '$lib/types/lot';

const params = (init = '') => new URLSearchParams(init);

describe('lotsSearchParams', () => {
	it('ne pose aucun filtre quand tout est vide / « tous »', () => {
		const out = lotsSearchParams(params(), emptyLotFilters());
		expect(out.toString()).toBe('');
	});

	it('ignore une recherche texte de moins de 3 caractères', () => {
		const out = lotsSearchParams(params(), { ...emptyLotFilters(), lot: '26' });
		expect(out.has('lot')).toBe(false);
	});

	it('pose le filtre texte dès 3 caractères (trimé)', () => {
		const out = lotsSearchParams(params(), { ...emptyLotFilters(), lot: '  000201 ' });
		expect(out.get('lot')).toBe('000201');
	});

	it('pose les selects, sauf la sentinelle « tous »', () => {
		const out = lotsSearchParams(params(), {
			...emptyLotFilters(),
			produit: 'prod-1',
			statut: 'BLOQUE'
		});
		expect(out.get('produit')).toBe('prod-1');
		expect(out.get('statut')).toBe('BLOQUE');
		expect(out.has('site')).toBe(false);
	});

	it('remet la pagination à la première page (retire page)', () => {
		const out = lotsSearchParams(params('page=4'), { ...emptyLotFilters(), produit: 'prod-1' });
		expect(out.has('page')).toBe(false);
	});

	it('préserve les autres paramètres (recherche globale q)', () => {
		const out = lotsSearchParams(params('q=lait'), { ...emptyLotFilters(), statut: 'EN_STOCK' });
		expect(out.get('q')).toBe('lait');
		expect(out.get('statut')).toBe('EN_STOCK');
	});

	it('relâche un filtre ramené sous 3 caractères (retire la clé)', () => {
		const out = lotsSearchParams(params('lot=000201'), { ...emptyLotFilters(), lot: '00' });
		expect(out.has('lot')).toBe(false);
	});
});

describe('lotsPageSizeParams', () => {
	it('pose la taille et repart en première page', () => {
		const out = lotsPageSizeParams(params('page=5&q=lait'), 50);
		expect(out.get('limit')).toBe('50');
		expect(out.has('page')).toBe(false);
		expect(out.get('q')).toBe('lait');
	});
});
