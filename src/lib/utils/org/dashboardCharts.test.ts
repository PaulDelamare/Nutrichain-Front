import { describe, it, expect } from 'vitest';
import { buildDashboardCharts } from './dashboardCharts';
import type { ApiAlert, ApiMovement, ApiQualityControl } from '$lib/Api/organization.server';
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

		expect(charts.lotStatus).toEqual([]);
		expect(charts.weeklyMovements.series).toEqual([]);
		expect(charts.alertSeverity).toEqual([]);
		expect(charts.qualityResults).toEqual([]);
	});
});

describe('buildDashboardCharts — contrôles qualité', () => {
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

	it('affiche un verdict inattendu tel quel plutôt que de le ranger ailleurs', () => {
		const charts = buildDashboardCharts([], [], [], [control('A_REVOIR', 'lot-1')]);
		expect(charts.qualityResults[0]).toMatchObject({ label: 'A_REVOIR', color: '#94a3b8' });
	});
});

describe('buildDashboardCharts — répartition des lots', () => {
	it('traduit les statuts connus et les classe du plus fréquent au plus rare', () => {
		const charts = buildDashboardCharts(
			[
				batch('l1', 'EN_STOCK'),
				batch('l2', 'EN_STOCK'),
				batch('l3', 'BLOQUE'),
				batch('l4', 'EN_ATTENTE_QC')
			],
			[],
			[],
			[]
		);

		// #81 — Le vocabulaire est celui des badges de lot : le camembert disait « En stock » et
		// « Bloqué » là où la recherche de lots affichait « Conforme » et « Quarantaine ».
		expect(charts.lotStatus.map((s) => s.label)).toEqual([
			'Conforme',
			'Quarantaine',
			'En attente de contrôle'
		]);
		expect(charts.lotStatus[0].value).toBe(2);
	});

	it('rend lisible un statut hors référentiel au lieu d’afficher le code brut', () => {
		const charts = buildDashboardCharts([batch('l1', 'STATUT_EXOTIQUE')], [], [], []);
		expect(charts.lotStatus[0]).toMatchObject({ label: 'Statut exotique', color: '#94a3b8' });
	});
});

describe('buildDashboardCharts — gravité des alertes', () => {
	function alert(niveau: string, statut = 'ACTIVE'): ApiAlert {
		return {
			id: `a-${niveau}-${statut}`,
			type: 'TEMP_EXCURSION',
			niveau_gravite: niveau,
			message: 'Excursion',
			statut,
			created_at: '2026-07-11T10:00:00.000Z'
		};
	}

	// Un graphe qui compte les alertes déjà résolues surestime la situation en cours.
	it('ne compte que les alertes encore actives', () => {
		const charts = buildDashboardCharts(
			[],
			[alert('CRITIQUE'), alert('HAUTE', 'RESOLVED')],
			[],
			[]
		);
		expect(charts.alertSeverity).toEqual([{ label: 'Critique', value: 1, color: '#ef4444' }]);
	});

	it('regroupe PANIC avec les alertes critiques', () => {
		const charts = buildDashboardCharts([], [alert('PANIC')], [], []);
		expect(charts.alertSeverity[0].label).toBe('Critique');
	});

	it('affiche une gravité inconnue telle quelle', () => {
		const charts = buildDashboardCharts([], [alert('EXTREME')], [], []);
		expect(charts.alertSeverity[0]).toMatchObject({ label: 'EXTREME', color: '#94a3b8' });
	});
});

describe('buildDashboardCharts — mouvements de la semaine', () => {
	function movement(type: string, date: Date): ApiMovement {
		return {
			id: Math.random(),
			type_action: type,
			quantite: 1,
			unite: 'L',
			created_at: date.toISOString()
		};
	}

	const ilYAJours = (n: number) => {
		const d = new Date();
		d.setDate(d.getDate() - n);
		return d;
	};

	it('couvre toujours sept jours, même sans mouvement', () => {
		const charts = buildDashboardCharts([], [], [], []);
		expect(charts.weeklyMovements.labels).toHaveLength(7);
	});

	it('ne trace que les catégories réellement observées', () => {
		const charts = buildDashboardCharts(
			[],
			[],
			[movement('RECEPTION', ilYAJours(1)), movement('EXPEDITION', ilYAJours(0))],
			[]
		);

		expect(charts.weeklyMovements.series.map((s) => s.name)).toEqual(['Réceptions', 'Expéditions']);
	});

	// L'API n'émet plus TRANSFORMATION / QUARANTAINE seuls — sans normalisation, ces séries restaient à 0.
	it('compte les types API réels (TRANSFORMATION_*, QUARANTAINE_FROID)', () => {
		const charts = buildDashboardCharts(
			[],
			[],
			[
				movement('TRANSFORMATION_ENTREE', ilYAJours(0)),
				movement('TRANSFORMATION_SORTIE', ilYAJours(1)),
				movement('QUARANTAINE_FROID', ilYAJours(0)),
				movement('LEVEE_QUARANTAINE', ilYAJours(2))
			],
			[]
		);

		expect(charts.weeklyMovements.series.map((s) => s.name).sort()).toEqual([
			'Quarantaines',
			'Transformations'
		]);
		expect(charts.weeklyMovements.series.find((s) => s.name === 'Transformations')?.data[6]).toBe(
			1
		);
		expect(
			charts.weeklyMovements.series
				.find((s) => s.name === 'Quarantaines')
				?.data.reduce((a, b) => a + b, 0)
		).toBe(2);
	});

	it('affiche ALERTE / EN_PRODUCTION / EPUISE avec leurs libellés API', () => {
		const charts = buildDashboardCharts(
			[batch('a', 'ALERTE'), batch('b', 'EN_PRODUCTION'), batch('c', 'EPUISE')],
			[],
			[],
			[]
		);
		expect(charts.lotStatus.map((s) => s.label).sort()).toEqual([
			'En production',
			'Sous rappel',
			'Épuisé'
		]);
		expect(charts.lotStatus.find((s) => s.label === 'Sous rappel')?.color).toBe('#f59e0b');
		expect(charts.lotStatus.find((s) => s.label === 'En production')?.color).toBe('#8fd4c5');
	});

	it('range chaque mouvement sur son jour', () => {
		const charts = buildDashboardCharts([], [], [movement('RECEPTION', ilYAJours(0))], []);
		const receptions = charts.weeklyMovements.series[0].data;
		expect(receptions[6]).toBe(1);
		expect(receptions.slice(0, 6)).toEqual([0, 0, 0, 0, 0, 0]);
	});

	it('ignore un mouvement plus vieux que la fenêtre affichée', () => {
		const charts = buildDashboardCharts([], [], [movement('RECEPTION', ilYAJours(30))], []);
		expect(charts.weeklyMovements.series).toEqual([]);
	});
});
