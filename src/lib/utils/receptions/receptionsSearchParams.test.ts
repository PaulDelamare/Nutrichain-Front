import { describe, it, expect } from 'vitest';
import { receptionsPageSizeParams, receptionsSearchParams } from './receptionsSearchParams';
import { emptyReceiptFilters } from '$lib/types/receipt';

const params = (init = '') => new URLSearchParams(init);

describe('receptionsSearchParams', () => {
	it('ne pose aucun filtre quand tout est vide / « tous »', () => {
		expect(receptionsSearchParams(params(), emptyReceiptFilters()).toString()).toBe('');
	});

	it('ignore une réf. de moins de 3 caractères', () => {
		const out = receptionsSearchParams(params(), { ...emptyReceiptFilters(), ref: 'BL' });
		expect(out.has('ref')).toBe(false);
	});

	it('pose la réf. dès 3 caractères (trimée)', () => {
		const out = receptionsSearchParams(params(), { ...emptyReceiptFilters(), ref: '  BL-2026 ' });
		expect(out.get('ref')).toBe('BL-2026');
	});

	it('pose les selects sauf la sentinelle « tous »', () => {
		const out = receptionsSearchParams(params(), {
			...emptyReceiptFilters(),
			fournisseur: 'four-1',
			statut: 'ALERTE'
		});
		expect(out.get('fournisseur')).toBe('four-1');
		expect(out.get('statut')).toBe('ALERTE');
	});

	it('pose la date telle quelle (pas de seuil de caractères)', () => {
		const out = receptionsSearchParams(params(), { ...emptyReceiptFilters(), date: '2026-07-31' });
		expect(out.get('date')).toBe('2026-07-31');
	});

	it('remet la pagination à la première page (retire page)', () => {
		const out = receptionsSearchParams(params('page=4'), {
			...emptyReceiptFilters(),
			statut: 'OK'
		});
		expect(out.has('page')).toBe(false);
	});

	it('préserve les autres paramètres (ex. limit)', () => {
		const out = receptionsSearchParams(params('limit=50'), {
			...emptyReceiptFilters(),
			statut: 'OK'
		});
		expect(out.get('limit')).toBe('50');
	});
});

describe('receptionsPageSizeParams', () => {
	it('pose la taille et repart en première page, en gardant les filtres', () => {
		const out = receptionsPageSizeParams(params('page=5&statut=OK'), 25);
		expect(out.get('limit')).toBe('25');
		expect(out.has('page')).toBe(false);
		expect(out.get('statut')).toBe('OK');
	});
});
