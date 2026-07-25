import { describe, it, expect } from 'vitest';
import {
	normalizeMovementType,
	movementEventLabel,
	MOVEMENT_CHART_TYPES,
	MOVEMENT_CHART_LABELS,
	MOVEMENT_CHART_COLORS
} from './labels';

describe('normalizeMovementType', () => {
	it('regroupe les réceptions, y compris celles issues de la synchro mobile', () => {
		expect(normalizeMovementType('RECEPTION')).toBe('RECEPTION');
		expect(normalizeMovementType('CREATE_RECEIPT_VIA_SYNC_RECEPTION')).toBe('RECEPTION');
	});

	it('reconnaît une expédition', () => {
		expect(normalizeMovementType('EXPEDITION')).toBe('EXPEDITION');
	});

	it('range la quarantaine froid avec les quarantaines', () => {
		expect(normalizeMovementType('QUARANTAINE_FROID')).toBe('QUARANTAINE');
		expect(normalizeMovementType('quarantaine')).toBe('QUARANTAINE');
	});

	it('regroupe entrée et sortie de transformation', () => {
		expect(normalizeMovementType('TRANSFORMATION_ENTREE')).toBe('TRANSFORMATION');
		expect(normalizeMovementType('TRANSFORM_CONSUME')).toBe('TRANSFORMATION');
		expect(normalizeMovementType('TRANSFORM_CREATE')).toBe('TRANSFORMATION');
	});

	it('classe en « Autres » un type que le front ne connaît pas, plutôt que de planter', () => {
		expect(normalizeMovementType('TYPE_INCONNU_DE_L_API')).toBe('AUTRE');
	});
});

describe('libellés et couleurs du graphe', () => {
	it('chaque catégorie du graphe a un libellé et une couleur — sinon la légende est trouée', () => {
		for (const type of MOVEMENT_CHART_TYPES) {
			expect(MOVEMENT_CHART_LABELS[type]).toBeTruthy();
			expect(MOVEMENT_CHART_COLORS[type]).toMatch(/^#[0-9a-f]{6}$/i);
		}
	});
});

describe('movementEventLabel', () => {
	it('nomme les événements EPCIS connus par leur type normalisé', () => {
		expect(movementEventLabel('EXPEDITION')).toBe('TransactionEvent — expédition');
		expect(movementEventLabel('RAPPEL')).toBe('TransactionEvent — rappel produit');
	});

	it('dégrade sur un ObjectEvent générique pour un type non répertorié', () => {
		expect(movementEventLabel('AUDIT_MANUEL')).toBe('ObjectEvent — AUDIT_MANUEL');
	});
});
