import { describe, it, expect } from 'vitest';
import { badgeLot, grouperSscc } from './affichage';

describe('badgeLot', () => {
	/**
	 * #81 : deux tables de libellés cohabitaient, et le même lot portait deux noms selon l'écran.
	 * Une table locale à cette page aurait de plus affiché REBUT et PERIME sous leur code brut —
	 * indistincts d'un statut anodin, sur le quai.
	 */
	it('reprend les libellés de la source unique du front, y compris pour les statuts rares', () => {
		expect(badgeLot('EN_STOCK').label).toBe('Conforme');
		expect(badgeLot('BLOQUE').label).toBe('Quarantaine');
		expect(badgeLot('ALERTE').label).toBe('Sous rappel');
		expect(badgeLot('REBUT').label).toBe('Mis au rebut');
		expect(badgeLot('PERIME').label).toBe('Périmé');
	});

	it('donne une couleur à chaque statut, sans jamais rendre le code brut', () => {
		for (const statut of ['EN_STOCK', 'BLOQUE', 'ALERTE', 'REBUT', 'PERIME', 'INCONNU']) {
			expect(badgeLot(statut).label).not.toBe(statut);
			expect(badgeLot(statut).couleur).toMatch(/^#[0-9a-f]{6}$/i);
		}
	});
});

describe('grouperSscc', () => {
	it('groupe les 18 chiffres par quatre', () => {
		expect(grouperSscc('034567890000000606')).toBe('0345 6789 0000 0006 06');
	});
});
