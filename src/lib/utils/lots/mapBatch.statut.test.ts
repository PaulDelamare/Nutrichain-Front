import { describe, it, expect } from 'vitest';
import { batchToRow } from './mapBatch';
import type { ApiBatch } from '$lib/Api/traceability.server';

function batch(statut: string): ApiBatch {
	return {
		id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
		statut,
		quantite_actuelle: '10',
		unite_code: 'kg',
		date_peremption: null
	};
}

describe('batchToRow — le statut affiché', () => {
	// « Conforme » est une affirmation sanitaire : elle ne doit jamais être un repli par défaut.
	it('n’affiche PAS « conforme » pour un lot périmé', () => {
		expect(batchToRow(batch('PERIME')).statut).toBe('perime');
	});

	it('n’affiche PAS « conforme » pour un statut inconnu de l’API', () => {
		expect(batchToRow(batch('UN_STATUT_QUON_NA_PAS_PREVU')).statut).toBe('inconnu');
	});

	it('n’affiche PAS « conforme » pour un lot expédié', () => {
		expect(batchToRow(batch('EXPEDIE')).statut).toBe('expedie');
	});

	it('affiche « conforme » uniquement pour un lot réellement en stock', () => {
		expect(batchToRow(batch('EN_STOCK')).statut).toBe('conforme');
	});

	it('affiche la quarantaine pour un lot bloqué', () => {
		expect(batchToRow(batch('BLOQUE')).statut).toBe('quarantaine');
	});
});
