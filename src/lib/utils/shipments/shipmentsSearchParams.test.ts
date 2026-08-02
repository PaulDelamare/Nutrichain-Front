import { describe, it, expect } from 'vitest';
import { shipmentsPageSizeParams, shipmentsSearchParams } from './shipmentsSearchParams';
import { emptyShipmentFilters } from '$lib/types/shipment';

const params = (init = '') => new URLSearchParams(init);

describe('shipmentsSearchParams', () => {
	it('ne pose aucun filtre quand tout est vide / « tous »', () => {
		expect(shipmentsSearchParams(params(), emptyShipmentFilters()).toString()).toBe('');
	});

	it('ignore une réf. de moins de 3 caractères', () => {
		const out = shipmentsSearchParams(params(), { ...emptyShipmentFilters(), ref: 'BL' });
		expect(out.has('ref')).toBe(false);
	});

	it('pose la réf. dès 3 caractères (trimée)', () => {
		const out = shipmentsSearchParams(params(), { ...emptyShipmentFilters(), ref: '  SSCC-9 ' });
		expect(out.get('ref')).toBe('SSCC-9');
	});

	it('pose les selects sauf la sentinelle « tous »', () => {
		const out = shipmentsSearchParams(params(), {
			...emptyShipmentFilters(),
			client: 'cli-1',
			statut: 'LIVRE'
		});
		expect(out.get('client')).toBe('cli-1');
		expect(out.get('statut')).toBe('LIVRE');
	});

	it('pose la date telle quelle', () => {
		const out = shipmentsSearchParams(params(), { ...emptyShipmentFilters(), date: '2026-07-31' });
		expect(out.get('date')).toBe('2026-07-31');
	});

	it('remet la pagination à la première page (retire page)', () => {
		const out = shipmentsSearchParams(params('page=4'), {
			...emptyShipmentFilters(),
			statut: 'EN_ROUTE'
		});
		expect(out.has('page')).toBe(false);
	});

	it('préserve les autres paramètres (ex. limit)', () => {
		const out = shipmentsSearchParams(params('limit=50'), {
			...emptyShipmentFilters(),
			statut: 'LIVRE'
		});
		expect(out.get('limit')).toBe('50');
	});
});

describe('shipmentsPageSizeParams', () => {
	it('pose la taille et repart en première page, en gardant les filtres', () => {
		const out = shipmentsPageSizeParams(params('page=5&statut=LIVRE'), 25);
		expect(out.get('limit')).toBe('25');
		expect(out.has('page')).toBe(false);
		expect(out.get('statut')).toBe('LIVRE');
	});
});
