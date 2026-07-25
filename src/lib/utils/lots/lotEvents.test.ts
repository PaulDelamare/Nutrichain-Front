import { describe, it, expect } from 'vitest';
import { movementsToLotEvents } from './lotEvents';
import type { ApiBatchMouvement } from '$lib/Api/traceability.server';

function mvt(partial: Partial<ApiBatchMouvement>): ApiBatchMouvement {
	return {
		id: 1,
		type_action: 'RECEPTION',
		quantite: 500,
		unite: 'KG',
		created_at: '2026-07-11T10:30:00.000Z',
		...partial
	};
}

describe('movementsToLotEvents', () => {
	it('ne rend aucune étape sans mouvement', () => {
		expect(movementsToLotEvents([])).toEqual([]);
	});

	it('traduit le code brut en libellé lisible', () => {
		const [e] = movementsToLotEvents([mvt({ type_action: 'LEVEE_QUARANTAINE' })]);
		expect(e.title).toBe('Levée de quarantaine');
	});

	it('affiche le code brut d’une étape inconnue plutôt que de la masquer', () => {
		const [e] = movementsToLotEvents([mvt({ type_action: 'ETAPE_FUTURE' })]);
		expect(e.title).toBe('ETAPE_FUTURE');
		expect(e.tone).toBe('neutral');
	});

	it('distingue la quarantaine (réversible) du rappel (irréversible)', () => {
		const [quarantaine] = movementsToLotEvents([mvt({ type_action: 'QUARANTAINE_FROID' })]);
		const [rappel] = movementsToLotEvents([mvt({ type_action: 'RAPPEL' })]);

		expect(quarantaine.tone).toBe('warn');
		expect(rappel.tone).toBe('danger');
		expect(quarantaine.tone).not.toBe(rappel.tone);
	});

	it('expose la CAUSE d’une quarantaine froid, pas seulement son existence', () => {
		const [e] = movementsToLotEvents([
			mvt({
				type_action: 'QUARANTAINE_FROID',
				metadata: { peakTemp: 9.2, threshold: 4, sensorId: 'CAP-01' }
			})
		]);
		expect(e.detail).toContain('Pic 9.2 °C (seuil 4 °C)');
		expect(e.detail).toContain('capteur CAP-01');
	});

	it('n’affiche pas une réception NON CONFORME comme une étape normale', () => {
		const [e] = movementsToLotEvents([
			mvt({ metadata: { statut_controle: 'NONCONFORME', quarantaine: true } })
		]);
		expect(e.tone).toBe('warn');
		expect(e.detail).toContain('lot placé en quarantaine');
	});

	it('affiche une réception conforme comme une étape normale', () => {
		const [e] = movementsToLotEvents([
			mvt({ metadata: { statut_controle: 'OK', quarantaine: false } })
		]);
		expect(e.tone).toBe('ok');
		expect(e.detail).not.toContain('quarantaine');
	});

	it('expose le motif d’une décision qualité', () => {
		const [e] = movementsToLotEvents([
			mvt({ type_action: 'LEVEE_QUARANTAINE', metadata: { motif: '2e contrôle conforme' } })
		]);
		expect(e.detail).toContain('Motif : 2e contrôle conforme');
	});

	it('n’invente aucun contexte quand l’API n’en fournit pas', () => {
		const [e] = movementsToLotEvents([mvt({ type_action: 'EXPEDITION', metadata: null })]);
		expect(e.detail).toBe('500 KG');
	});

	it('nomme l’opérateur quand il est connu', () => {
		const [e] = movementsToLotEvents([mvt({ user: { name: 'Marie Dupont' } })]);
		expect(e.detail).toContain('par Marie Dupont');
	});
});
