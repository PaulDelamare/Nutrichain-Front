import { describe, it, expect } from 'vitest';
import {
	alertsToCold,
	alertsToRappels,
	auditLogsToRows,
	auditToConnectors,
	buildDashboardKpis,
	buildDashboardTasks,
	buildPortailBrief,
	countActiveColdAlerts,
	genealogyToGraph,
	movementsToEvents,
	qualityToNc
} from './mappers';
import type { ApiAlert, ApiAuditLog, ApiQualityControl } from '$lib/Api/organization.server';
import type { ApiGenealogy } from '$lib/Api/traceability.server';

function auditLog(partial: Partial<ApiAuditLog>): ApiAuditLog {
	return {
		id: 1,
		action: 'CREATE',
		entity: 'Batch',
		entity_id: 'lot-1',
		horodatage: '2026-07-11T10:00:00.000Z',
		...partial
	};
}

function alert(partial: Partial<ApiAlert>): ApiAlert {
	return {
		id: '11111111-2222-3333-4444-555555555555',
		type: 'TEMP_EXCURSION',
		niveau_gravite: 'CRITIQUE',
		message: 'Excursion de température',
		statut: 'ACTIVE',
		created_at: '2026-07-11T10:00:00.000Z',
		...partial
	};
}

describe('auditLogsToRows', () => {
	it('traduit une action connue en libellé lisible et conserve le code brut', () => {
		const [row] = auditLogsToRows([auditLog({ action: 'LIFT_BATCH_QUARANTINE' })]);
		expect(row.actionLabel).toBe('Levée de quarantaine');
		expect(row.action).toBe('LIFT_BATCH_QUARANTINE');
	});

	it('retombe sur le code brut pour une action inconnue', () => {
		const [row] = auditLogsToRows([auditLog({ action: 'ACTION_INEXISTANTE' })]);
		expect(row.actionLabel).toBe('ACTION_INEXISTANTE');
	});

	it('extrait le motif depuis nouvelle_valeur', () => {
		const [row] = auditLogsToRows([
			auditLog({
				action: 'LIFT_BATCH_QUARANTINE',
				nouvelle_valeur: { statut: 'EN_STOCK', motif: '2e contrôle conforme' }
			})
		]);
		expect(row.detail).toBe('2e contrôle conforme');
	});

	it('affiche le changement de statut quand il n’y a pas de motif', () => {
		const [row] = auditLogsToRows([
			auditLog({
				ancienne_valeur: { statut: 'EN_STOCK' },
				nouvelle_valeur: { statut: 'ALERTE' }
			})
		]);
		expect(row.detail).toBe('EN_STOCK → ALERTE');
	});

	it('laisse le détail vide sans motif ni changement de statut', () => {
		const [row] = auditLogsToRows([auditLog({})]);
		expect(row.detail).toBe('');
	});
});

// Règle commune à tous les mappers : une réponse API valide mais vide produit une sortie vide.
// Jamais une donnée inventée — c'est le cas nominal d'une base saine, pas une panne.

describe('alertsToCold', () => {
	it('ne rend ni incident ni ligne quand aucune alerte froid n’est active', () => {
		expect(alertsToCold([], [])).toEqual({ incident: null, rows: [] });
	});

	it('n’invente pas de site ni de zone quand le matériel est inconnu', () => {
		const { rows } = alertsToCold([alert({ id_materiel: 'inconnu' })], []);
		expect(rows[0].site).toBe('—');
		expect(rows[0].zone).toBe('—');
	});
});

describe('alertsToRappels', () => {
	it('ne rend aucun rappel quand aucune alerte de rappel n’existe', () => {
		expect(alertsToRappels([])).toEqual([]);
	});

	it('n’invente pas de sites impactés quand l’API n’en fournit pas', () => {
		const [recall] = alertsToRappels([alert({ type: 'PRODUCT_RECALL', message: 'Salmonelle' })]);
		expect(recall.sites).toBe('—');
	});

	it('n’expose aucune progression : l’API ne suit pas les confirmations magasin', () => {
		const [recall] = alertsToRappels([alert({ type: 'PRODUCT_RECALL', message: 'Salmonelle' })]);
		expect(recall).not.toHaveProperty('progress');
		expect(recall).not.toHaveProperty('progressLabel');
	});

	it('reprend les chiffres réels annoncés par l’API', () => {
		const [recall] = alertsToRappels([
			alert({
				type: 'PRODUCT_RECALL',
				message:
					'RAPPEL DÉCLENCHÉ : Salmonelle. Source: lot-9. Total lots impactés: 4. Expéditions à notifier: 2.'
			})
		]);
		expect(recall.lots).toBe('4 lot(s) bloqué(s)');
		expect(recall.sites).toBe('2 expédition(s) à notifier');
	});
});

describe('buildDashboardKpis', () => {
	it('ne rend que des indicateurs calculés — aucun KPI d’intégration inventé', () => {
		const kpis = buildDashboardKpis(0, [], 0, 0);
		expect(kpis).toHaveLength(4);
		expect(kpis.map((k) => k.label)).not.toContain('Sync. intégrations');
		expect(JSON.stringify(kpis)).not.toContain('99 %');
	});
});

describe('buildDashboardTasks', () => {
	it('ne rend aucune tâche quand il n’y a rien à traiter', () => {
		expect(buildDashboardTasks([], 0)).toEqual([]);
	});
});

describe('movementsToEvents', () => {
	it('ne rend aucun événement quand il n’y a aucun mouvement', () => {
		expect(movementsToEvents([])).toEqual([]);
	});
});

describe('buildPortailBrief', () => {
	it('ne rend aucune consigne quand aucun rappel n’est actif', () => {
		expect(buildPortailBrief([])).toBeNull();
	});

	it('reprend le message réel du rappel actif', () => {
		const brief = buildPortailBrief([
			alert({ type: 'PRODUCT_RECALL', message: 'Retrait immédiat' })
		]);
		expect(brief?.text).toBe('Retrait immédiat');
	});
});

describe('auditToConnectors', () => {
	it('ne rend aucun connecteur inventé quand le journal n’en contient pas', () => {
		expect(auditToConnectors([auditLog({})])).toEqual([]);
	});
});

describe('countActiveColdAlerts', () => {
	it('ne compte QUE les alertes froid actives — c’est le chiffre du badge global', () => {
		const alerts = [
			alert({ type: 'TEMP_EXCURSION', statut: 'ACTIVE' }),
			alert({ type: 'TEMP_EXCURSION', statut: 'RESOLVED' }),
			alert({ type: 'PRODUCT_RECALL', statut: 'ACTIVE' })
		];
		expect(countActiveColdAlerts(alerts)).toBe(1);
	});

	it('vaut zéro sans aucune alerte', () => {
		expect(countActiveColdAlerts([])).toBe(0);
	});
});

describe('qualityToNc', () => {
	function control(resultat: string): ApiQualityControl {
		return {
			id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
			type_test: 'Analyse microbiologique',
			resultat,
			date_test: '2026-07-11T10:00:00.000Z',
			lot: { id: 'lot-1' }
		};
	}

	it('n’inscrit PAS un contrôle conforme dans la liste des non-conformités', () => {
		expect(qualityToNc([control('CONFORME')])).toEqual([]);
	});

	it('retient les contrôles qui demandent une action', () => {
		const rows = qualityToNc([control('NON_CONFORME — QUARANTAINE'), control('EN_COURS')]);
		expect(rows).toHaveLength(2);
		expect(rows[0].statut).toBe('quarantaine');
		expect(rows[1].statut).toBe('en_cours');
	});
});

describe('genealogyToGraph', () => {
	it('n’invente pas le statut « EN_STOCK » quand le lot analysé est inconnu', () => {
		const genealogy: ApiGenealogy = { batchId: 'lot-1', upstream: [], downstream: [] };
		const graph = genealogyToGraph(genealogy, undefined);
		expect(graph.selected.badge).toBeUndefined();
	});
});
