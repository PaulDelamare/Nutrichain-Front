import { describe, it, expect } from 'vitest';
import {
	EQUIPMENT_TYPE_OPTIONS,
	EQUIPMENT_TYPES,
	COLD_EQUIPMENT_TYPES,
	estTypeMateriel,
	equipmentTypeLabel
} from './equipment';

describe('référentiel des types de matériel', () => {
	it('expose les mêmes valeurs que les options proposées à l’utilisateur', () => {
		expect(EQUIPMENT_TYPES).toEqual(EQUIPMENT_TYPE_OPTIONS.map((o) => o.value));
	});

	// Ces types pilotent la surveillance IoT : en sortir un frigo, c'est arrêter de le surveiller.
	it('ne considère comme « froid » que le frigo et le congélateur', () => {
		expect(COLD_EQUIPMENT_TYPES).toEqual(['FRIGO', 'CONGELATEUR']);
		expect(COLD_EQUIPMENT_TYPES.every((t) => EQUIPMENT_TYPES.includes(t))).toBe(true);
	});
});

describe('estTypeMateriel', () => {
	it('accepte un type du référentiel', () => {
		expect(estTypeMateriel('FRIGO')).toBe(true);
	});

	it('refuse une valeur hors référentiel — la saisie libre partirait en base', () => {
		expect(estTypeMateriel('FOUR')).toBe(false);
		expect(estTypeMateriel('frigo')).toBe(false);
	});
});

describe('equipmentTypeLabel', () => {
	it('traduit un type connu en français', () => {
		expect(equipmentTypeLabel('CONGELATEUR')).toBe('Congélateur');
	});

	it('affiche la valeur brute plutôt que rien pour un type inconnu', () => {
		expect(equipmentTypeLabel('FOUR')).toBe('FOUR');
	});
});
