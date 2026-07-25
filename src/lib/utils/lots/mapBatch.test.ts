import { describe, it, expect } from 'vitest';
import { batchToRow } from './mapBatch';
import type { ApiBatch } from '$lib/Api/traceability.server';

function batch(statut: string): ApiBatch {
	return { id: 'lot-1', lot_number: 'L1', statut } as ApiBatch;
}

describe('mapBatch — mapStatut', () => {
	it('mappe BLOQUE sur quarantaine', () => {
		expect(batchToRow(batch('BLOQUE')).statut).toBe('quarantaine');
	});

	it('mappe ALERTE sur surveillance (lot rappelé)', () => {
		expect(batchToRow(batch('ALERTE')).statut).toBe('surveillance');
	});

	it('mappe EN_STOCK sur conforme', () => {
		expect(batchToRow(batch('EN_STOCK')).statut).toBe('conforme');
	});
});
