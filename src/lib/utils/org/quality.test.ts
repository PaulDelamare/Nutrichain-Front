import { describe, it, expect } from 'vitest';
import { normalizeQualityResult, openQualityIssues } from './quality';
import type { ApiQualityControl } from '$lib/Api/organization.server';

function qc(resultat: string): ApiQualityControl {
	return {
		id: `qc-${resultat}`,
		type_test: 'Analyse microbiologique',
		resultat,
		date_test: '2026-07-11T08:00:00.000Z',
		lot: { id: 'lot-1', produit: { nom: 'Bouteille de Lait 1L' } }
	};
}

describe('normalizeQualityResult', () => {
	// L'API a historisé plusieurs graphies (`NON_CONFORME_MINEUR`, `EN_COURS_ANALYSE`…) :
	// comparer la chaîne brute faisait passer un lot non conforme pour un cas « autre ».
	it('ramène les déclinaisons de non-conformité à un seul verdict', () => {
		expect(normalizeQualityResult('NON_CONFORME')).toBe('NON_CONFORME');
		expect(normalizeQualityResult('non_conforme_majeur')).toBe('NON_CONFORME');
	});

	it('reconnaît une analyse encore en cours', () => {
		expect(normalizeQualityResult('EN_COURS_ANALYSE')).toBe('EN_COURS');
	});

	it('reconnaît un résultat conforme', () => {
		expect(normalizeQualityResult('conforme')).toBe('CONFORME');
	});

	it('laisse passer en majuscules un verdict inattendu plutôt que de l’inventer', () => {
		expect(normalizeQualityResult('a_revoir')).toBe('A_REVOIR');
	});
});

describe('openQualityIssues', () => {
	it('ne retient que ce qui n’est pas encore conforme', () => {
		const ouverts = openQualityIssues([
			qc('CONFORME'),
			qc('NON_CONFORME_MINEUR'),
			qc('EN_COURS_ANALYSE')
		]);
		expect(ouverts.map((q) => q.resultat)).toEqual(['NON_CONFORME_MINEUR', 'EN_COURS_ANALYSE']);
	});

	it('ne signale rien quand tous les contrôles sont conformes', () => {
		expect(openQualityIssues([qc('CONFORME'), qc('conforme')])).toEqual([]);
	});
});
