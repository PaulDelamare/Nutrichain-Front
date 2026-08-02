import { describe, it, expect } from 'vitest';
import { recallsPageSizeParams, recallsSearchParams } from './recallsSearchParams';
import { emptyRecallFilters } from '$lib/types/recall';

const params = (init = '') => new URLSearchParams(init);

describe('recallsSearchParams', () => {
	it('ne pose aucun filtre quand tout est vide / « tous »', () => {
		expect(recallsSearchParams(params(), emptyRecallFilters()).toString()).toBe('');
	});

	it('ignore une recherche de moins de 3 caractères', () => {
		const out = recallsSearchParams(params(), { ...emptyRecallFilters(), q: 'li' });
		expect(out.has('q')).toBe(false);
	});

	it('pose la recherche dès 3 caractères (trimée)', () => {
		const out = recallsSearchParams(params(), { ...emptyRecallFilters(), q: '  listeria ' });
		expect(out.get('q')).toBe('listeria');
	});

	it('pose le statut sauf la sentinelle « tous »', () => {
		expect(
			recallsSearchParams(params(), { ...emptyRecallFilters(), statut: 'en_cours' }).get('statut')
		).toBe('en_cours');
		expect(
			recallsSearchParams(params(), { ...emptyRecallFilters(), statut: 'tous' }).has('statut')
		).toBe(false);
	});

	it('remet la pagination à la première page (retire page)', () => {
		const out = recallsSearchParams(params('page=4'), {
			...emptyRecallFilters(),
			statut: 'cloture'
		});
		expect(out.has('page')).toBe(false);
	});

	it('préserve les autres paramètres (ex. limit)', () => {
		const out = recallsSearchParams(params('limit=50'), {
			...emptyRecallFilters(),
			statut: 'en_cours'
		});
		expect(out.get('limit')).toBe('50');
	});
});

describe('recallsPageSizeParams', () => {
	it('pose la taille et repart en première page, en gardant les filtres', () => {
		const out = recallsPageSizeParams(params('page=5&statut=en_cours'), 25);
		expect(out.get('limit')).toBe('25');
		expect(out.has('page')).toBe(false);
		expect(out.get('statut')).toBe('en_cours');
	});
});
