import { describe, expect, it } from 'vitest';
import { BATCH_STATUSES, batchStatusColor, batchStatusLabel, toLotStatus } from './batchStatus';
import { lotStatusLabel } from '$lib/utils/lots/lotStatusLabel';

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

	/**
	 * #81 — Il y avait DEUX tables de libellés dans le front : celle-ci et celle des badges de lot
	 * (`lotStatusLabel`). Elles se contredisaient — `BLOQUE` valait « Bloqué » sur le camembert du
	 * tableau de bord et « Quarantaine » dans la recherche, `EN_STOCK` « En stock » ici et
	 * « Conforme » là. Deux écrans, deux mots pour le même lot.
	 *
	 * Ce test échoue dès qu'une des deux tables repart de son côté.
	 */
	it('dit la même chose que le badge de lot, pour chaque statut de l’API (#81)', () => {
		for (const code of Object.values(BATCH_STATUSES)) {
			expect(batchStatusLabel(code)).toBe(lotStatusLabel(toLotStatus(code)));
		}
	});

	it('traduit aussi les alias historiques des anciennes données de démo', () => {
		expect(batchStatusLabel('QUARANTAINE')).toBe('Quarantaine');
		expect(batchStatusLabel('PRET')).toBe('Conforme');
		expect(batchStatusLabel('PERIME')).toBe('Périmé');
	});

	it('reste lisible sur un code que le front ne connaît pas encore', () => {
		// Pas d'« Inconnu » fourre-tout : deux nouveaux codes de l'API donneraient deux parts de
		// camembert portant la même légende.
		expect(batchStatusLabel('EN_TRANSIT_DOUANE')).toBe('En transit douane');
	});
});
