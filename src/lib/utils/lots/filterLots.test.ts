import { describe, it, expect } from 'vitest';
import { filterLots } from './filterLots';
import { emptyLotFilters, type LotRow } from '$lib/types/lot';

function lot(partial: Partial<LotRow> = {}): LotRow {
	return {
		id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
		lotNumber: '260711-000201',
		produit: 'Bouteille de Lait 1L',
		gtin: '03701234500012',
		site: 'Usine Loire',
		statut: 'conforme',
		temperature: '4 °C',
		...partial
	};
}

describe('filterLots', () => {
	it('ne retire rien quand aucun filtre n’est saisi', () => {
		const rows = [lot(), lot({ id: 'autre', statut: 'quarantaine' })];
		expect(filterLots(rows, emptyLotFilters())).toHaveLength(2);
	});

	it('cherche le numéro de lot sans tenir compte de la casse ni des espaces', () => {
		const rows = [lot(), lot({ id: 'b', lotNumber: '260712-000999' })];
		const trouves = filterLots(rows, { ...emptyLotFilters(), lot: '  000201 ' });
		expect(trouves.map((r) => r.lotNumber)).toEqual(['260711-000201']);
	});

	it('retombe sur l’UUID quand le lot n’a pas de numéro GS1', () => {
		const rows = [lot({ lotNumber: undefined, id: 'ffff-1234' })];
		expect(filterLots(rows, { ...emptyLotFilters(), lot: '1234' })).toHaveLength(1);
	});

	it('filtre sur le GTIN partiel', () => {
		const rows = [lot(), lot({ id: 'b', gtin: '03709999900011' })];
		expect(filterLots(rows, { ...emptyLotFilters(), gtin: '45000' })).toHaveLength(1);
	});

	it('« tous » n’exclut aucun produit, site ni statut', () => {
		const rows = [lot({ produit: 'Yaourt' }), lot({ id: 'b', site: 'Entrepôt Rennes' })];
		expect(filterLots(rows, emptyLotFilters())).toHaveLength(2);
	});

	it('combine produit, site et statut — un lot ne passe que s’il satisfait tout', () => {
		const rows = [
			lot({ produit: 'Yaourt', site: 'Usine Loire', statut: 'quarantaine' }),
			lot({ id: 'b', produit: 'Yaourt', site: 'Entrepôt Rennes', statut: 'quarantaine' }),
			lot({ id: 'c', produit: 'Yaourt', site: 'Usine Loire', statut: 'conforme' })
		];

		const trouves = filterLots(rows, {
			...emptyLotFilters(),
			produit: 'Yaourt',
			site: 'Usine Loire',
			statut: 'quarantaine'
		});

		expect(trouves).toHaveLength(1);
		expect(trouves[0].site).toBe('Usine Loire');
	});
});
