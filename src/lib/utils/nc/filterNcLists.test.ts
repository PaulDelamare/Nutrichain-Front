import { describe, it, expect } from 'vitest';
import { filterOpenNc, filterPendingQc, filterQuarantine } from './filterNcLists';
import {
	emptyNcOpenFilters,
	emptyPendingQcFilters,
	emptyQuarantineFilters
} from '$lib/types/ncFilters';
import type { NcRow, QuarantineLot } from '$lib/types/nc';
import type { PendingQcLot } from '$lib/types/quality';

function pending(partial: Partial<PendingQcLot> = {}): PendingQcLot {
	return {
		id: 'p1',
		lot: '260731-000201',
		produit: 'Bouteille de Lait 1L',
		quantite: '300 L',
		depuis: 'depuis 2 jours',
		...partial
	};
}

function nc(partial: Partial<NcRow> = {}): NcRow {
	return {
		id: '0A595EC9',
		type: 'Analyse microbiologique',
		lot: 'Plaquette de Beurre Doux 250g',
		statut: 'quarantaine',
		...partial
	};
}

function quarantine(partial: Partial<QuarantineLot> = {}): QuarantineLot {
	return {
		id: 'a26b8f1f-f569-44be-b907-9a6d45b5a00b',
		numero: '260731-EQHAFW',
		detail: 'Plaquette de Beurre Doux 250g — Quarantaine',
		...partial
	};
}

describe('filterPendingQc', () => {
	it('ne retire rien sans filtre', () => {
		const rows = [pending(), pending({ id: 'p2', produit: 'Yaourt' })];
		expect(filterPendingQc(rows, emptyPendingQcFilters())).toHaveLength(2);
	});

	it('ignore une recherche texte de moins de 3 caractères', () => {
		const rows = [pending({ lot: '260731-000201' }), pending({ id: 'p2', lot: '999999' })];
		expect(filterPendingQc(rows, { ...emptyPendingQcFilters(), lot: '26' })).toHaveLength(2);
	});

	it('filtre le lot dès 3 caractères, sans casse', () => {
		const rows = [pending({ lot: '260731-000201' }), pending({ id: 'p2', lot: '999999' })];
		expect(filterPendingQc(rows, { ...emptyPendingQcFilters(), lot: '000201' })).toHaveLength(1);
	});

	it('« tous » ne filtre aucun produit ; une valeur exige l’égalité', () => {
		const rows = [pending({ produit: 'Yaourt' }), pending({ id: 'p2', produit: 'Beurre' })];
		expect(filterPendingQc(rows, { ...emptyPendingQcFilters(), produit: 'tous' })).toHaveLength(2);
		expect(filterPendingQc(rows, { ...emptyPendingQcFilters(), produit: 'Yaourt' })).toHaveLength(
			1
		);
	});

	it('combine les colonnes — un lot ne passe que s’il satisfait tout', () => {
		const rows = [
			pending({ produit: 'Yaourt', quantite: '300 L' }),
			pending({ id: 'p2', produit: 'Yaourt', quantite: '50 L' })
		];
		const trouves = filterPendingQc(rows, {
			...emptyPendingQcFilters(),
			produit: 'Yaourt',
			quantite: '300'
		});
		expect(trouves).toHaveLength(1);
		expect(trouves[0].quantite).toBe('300 L');
	});
});

describe('filterOpenNc', () => {
	it('filtre l’ID dès 3 caractères, sans casse', () => {
		const rows = [nc({ id: '0A595EC9' }), nc({ id: 'FF11AA22' })];
		expect(filterOpenNc(rows, { ...emptyNcOpenFilters(), id: '595' })).toHaveLength(1);
	});

	it('sélectionne un statut ; « tous » les garde', () => {
		const rows = [nc({ statut: 'quarantaine' }), nc({ id: 'X', statut: 'en_cours' })];
		expect(filterOpenNc(rows, { ...emptyNcOpenFilters(), statut: 'tous' })).toHaveLength(2);
		expect(filterOpenNc(rows, { ...emptyNcOpenFilters(), statut: 'en_cours' })).toHaveLength(1);
	});

	it('sélectionne un type', () => {
		const rows = [
			nc({ type: 'Analyse microbiologique' }),
			nc({ id: 'X', type: 'Contrôle visuel' })
		];
		const trouves = filterOpenNc(rows, { ...emptyNcOpenFilters(), type: 'Contrôle visuel' });
		expect(trouves.map((r) => r.type)).toEqual(['Contrôle visuel']);
	});
});

describe('filterQuarantine', () => {
	it('ignore une recherche de moins de 3 caractères', () => {
		const rows = [
			quarantine({ numero: '260731-EQHAFW' }),
			quarantine({ id: 'b', numero: 'AAAAAA' })
		];
		expect(filterQuarantine(rows, { ...emptyQuarantineFilters(), numero: '26' })).toHaveLength(2);
	});

	it('filtre le numéro et le détail dès 3 caractères', () => {
		const rows = [
			quarantine({ numero: '260731-EQHAFW', detail: 'Beurre — Quarantaine' }),
			quarantine({ id: 'b', numero: 'AAAAAA', detail: 'Lait — Quarantaine' })
		];
		expect(filterQuarantine(rows, { ...emptyQuarantineFilters(), numero: 'EQHAFW' })).toHaveLength(
			1
		);
		expect(filterQuarantine(rows, { ...emptyQuarantineFilters(), detail: 'Beurre' })).toHaveLength(
			1
		);
	});
});
