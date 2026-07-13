import { describe, it, expect } from 'vitest';
import { buildDashboardCharts } from './dashboardCharts';
import type { ApiQualityControl } from '$lib/Api/organization.server';
import type { ApiBatch } from '$lib/Api/traceability.server';

function batch(id: string, statut = 'EN_STOCK'): ApiBatch {
	return {
		id,
		statut,
		quantite_actuelle: '10',
		unite_code: 'kg',
		date_peremption: null
	};
}

function control(resultat: string, lotId: string): ApiQualityControl {
	return {
		id: `qc-${lotId}`,
		type_test: 'Microbiologique',
		resultat,
		date_test: '2026-07-11T10:00:00.000Z',
		lot: { id: lotId }
	};
}

describe('buildDashboardCharts — une base vide ne produit aucun chiffre', () => {
	it('ne rend AUCUN segment, sur AUCUN graphe, quand la base est vide', () => {
		const charts = buildDashboardCharts([], [], [], []);

		// Un segment « sentinelle » à 1 serait affiché « 1 » au centre du donut : c'est un
		// chiffre inventé, exactement ce qu'on purge.
		expect(charts.lotStatus).toEqual([]);
		expect(charts.weeklyMovements.series).toEqual([]);
		expect(charts.alertSeverity).toEqual([]);
		expect(charts.qualityResults).toEqual([]);
	});
});

describe('buildDashboardCharts — contrôles qualité', () => {
	// Le bug historique : `conforme = batchCount - nonConforme - enCours` déclarait conforme
	// tout lot n'ayant JAMAIS été contrôlé. Sur un système de sécurité sanitaire, c'est le
	// mensonge le plus coûteux : il affirme une conformité que personne n'a vérifiée.
	it('ne déclare PAS conformes les lots qui n’ont jamais été contrôlés', () => {
		const charts = buildDashboardCharts([batch('lot-1'), batch('lot-2')], [], [], []);
		expect(charts.qualityResults.find((s) => s.label === 'Conforme')).toBeUndefined();
	});

	it('ne compte comme conformes que les contrôles réellement conformes', () => {
		const charts = buildDashboardCharts(
			[batch('lot-1'), batch('lot-2'), batch('lot-3')],
			[],
			[],
			[control('CONFORME', 'lot-1'), control('NON_CONFORME', 'lot-2')]
		);
		expect(charts.qualityResults.find((s) => s.label === 'Conforme')?.value).toBe(1);
		expect(charts.qualityResults.find((s) => s.label === 'Non conforme')?.value).toBe(1);
	});
});
