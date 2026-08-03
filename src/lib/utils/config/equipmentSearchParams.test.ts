import { describe, it, expect } from 'vitest';
import { equipmentPageSizeParams, equipmentSearchParams } from './equipmentSearchParams';
import { emptyEquipmentFilters } from '$lib/types/equipment';

const params = (init = '') => new URLSearchParams(init);

describe('equipmentSearchParams', () => {
	it('garde tab=equipment et ne pose aucun filtre quand tout est vide / « tous »', () => {
		expect(equipmentSearchParams(params(), emptyEquipmentFilters()).toString()).toBe(
			'tab=equipment'
		);
	});

	it('ignore un nom de moins de 3 caractères, le pose dès 3 (trimé)', () => {
		expect(
			equipmentSearchParams(params(), { ...emptyEquipmentFilters(), nom: 'fr' }).has('nom')
		).toBe(false);
		expect(
			equipmentSearchParams(params(), { ...emptyEquipmentFilters(), nom: '  frigo ' }).get('nom')
		).toBe('frigo');
	});

	it('pose le type sauf la sentinelle « tous »', () => {
		expect(
			equipmentSearchParams(params(), { ...emptyEquipmentFilters(), type: 'FRIGO' }).get('type')
		).toBe('FRIGO');
		expect(
			equipmentSearchParams(params(), { ...emptyEquipmentFilters(), type: 'tous' }).has('type')
		).toBe(false);
	});

	it('remet la pagination à la première page (retire page)', () => {
		const out = equipmentSearchParams(params('tab=equipment&page=4'), {
			...emptyEquipmentFilters(),
			type: 'CONGELATEUR'
		});
		expect(out.has('page')).toBe(false);
	});
});

describe('equipmentPageSizeParams', () => {
	it('pose la taille, garde l’onglet et repart en première page', () => {
		const out = equipmentPageSizeParams(params('tab=equipment&page=5&type=FRIGO'), 50);
		expect(out.get('limit')).toBe('50');
		expect(out.get('tab')).toBe('equipment');
		expect(out.has('page')).toBe(false);
		expect(out.get('type')).toBe('FRIGO');
	});
});
