import { describe, expect, it } from 'vitest';
import { BATCH_STATUSES, batchStatusColor, batchStatusLabel, toLotStatus } from './batchStatus';

describe('vocabulaire des statuts de lot (API)', () => {
	it('couvre chaque statut émis par l’API', () => {
		for (const code of Object.values(BATCH_STATUSES)) {
			expect(batchStatusLabel(code)).not.toBe(code.replace(/_/g, ' ').toLowerCase());
			expect(batchStatusColor(code)).toMatch(/^#[0-9a-f]{6}$/i);
		}
	});

	it('mappe EN_PRODUCTION / EPUISE / REBUT / ALERTE vers des états UI connus', () => {
		expect(toLotStatus('EN_PRODUCTION')).toBe('en_production');
		expect(toLotStatus('EPUISE')).toBe('epuise');
		expect(toLotStatus('REBUT')).toBe('rebut');
		expect(toLotStatus('ALERTE')).toBe('surveillance');
		expect(toLotStatus('BLOQUE')).toBe('quarantaine');
	});

	it('ne classe pas un lot sous rappel comme « inconnu » (gris)', () => {
		expect(toLotStatus('ALERTE')).not.toBe('inconnu');
		expect(batchStatusLabel('ALERTE')).toBe('Sous rappel');
	});
});
