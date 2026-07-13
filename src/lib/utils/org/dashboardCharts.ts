import type { ApiAlert, ApiMovement, ApiQualityControl } from '$lib/Api/organization.server';
import type { ApiBatch } from '$lib/Api/traceability.server';
import type { ChartSegment, DashboardCharts } from '$lib/types/dashboard-charts';
import { normalizeQualityResult } from './quality';

const LOT_STATUS_LABELS: Record<string, string> = {
	EN_STOCK: 'En stock',
	EN_ATTENTE_QC: 'En attente de contrôle',
	SURVEILLANCE: 'Surveillance',
	QUARANTAINE: 'Quarantaine',
	QUARANTINE: 'Quarantaine',
	BLOQUE: 'Bloqué',
	PRET: 'Prêt',
	EXPEDIE: 'Expédié',
	PERIME: 'Périmé'
};

const LOT_STATUS_COLORS: Record<string, string> = {
	EN_STOCK: '#1b6b5c',
	EN_ATTENTE_QC: '#6366f1',
	SURVEILLANCE: '#5aafa0',
	QUARANTAINE: '#f59e0b',
	QUARANTINE: '#f59e0b',
	BLOQUE: '#ef4444',
	PRET: '#8fd4c5',
	EXPEDIE: '#64748b',
	PERIME: '#94a3b8'
};

const MOVEMENT_LABELS: Record<string, string> = {
	RECEPTION: 'Réceptions',
	EXPEDITION: 'Expéditions',
	QUARANTAINE: 'Quarantaines',
	TRANSFORMATION: 'Transformations'
};

const MOVEMENT_COLORS: Record<string, string> = {
	RECEPTION: '#1b6b5c',
	EXPEDITION: '#5aafa0',
	QUARANTAINE: '#f59e0b',
	TRANSFORMATION: '#8fd4c5'
};

const SEVERITY_LABELS: Record<string, string> = {
	CRITIQUE: 'Critique',
	HAUTE: 'Haute',
	MOYENNE: 'Moyenne',
	FAIBLE: 'Faible'
};

const SEVERITY_COLORS: Record<string, string> = {
	CRITIQUE: '#ef4444',
	HAUTE: '#f59e0b',
	MOYENNE: '#5aafa0',
	FAIBLE: '#94a3b8'
};

const QUALITY_LABELS: Record<string, string> = {
	CONFORME: 'Conforme',
	EN_COURS: 'En cours',
	NON_CONFORME: 'Non conforme'
};

const QUALITY_COLORS: Record<string, string> = {
	CONFORME: '#1b6b5c',
	EN_COURS: '#5aafa0',
	NON_CONFORME: '#ef4444'
};

function countBy<T>(items: T[], keyFn: (item: T) => string): ChartSegment[] {
	const map = new Map<string, number>();
	for (const item of items) {
		const key = keyFn(item);
		map.set(key, (map.get(key) ?? 0) + 1);
	}
	return [...map.entries()]
		.map(([key, value]) => ({ key, value }))
		.sort((a, b) => b.value - a.value)
		.map(({ key, value }) => ({
			label: key,
			value,
			color: '#94a3b8'
		}));
}

function lotStatusChart(batches: ApiBatch[]): ChartSegment[] {
	const segments = countBy(batches, (b) => b.statut);
	return segments.map((s) => ({
		label: LOT_STATUS_LABELS[s.label] ?? s.label.replace(/_/g, ' ').toLowerCase(),
		value: s.value,
		color: LOT_STATUS_COLORS[s.label] ?? '#94a3b8'
	}));
}

function last7DayLabels(): string[] {
	const labels: string[] = [];
	const today = new Date();
	for (let i = 6; i >= 0; i--) {
		const d = new Date(today);
		d.setDate(d.getDate() - i);
		labels.push(d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', ''));
	}
	return labels;
}

function dayKey(iso: string): string {
	const d = new Date(iso);
	return d.toLocaleDateString('fr-FR');
}

function weeklyMovementsChart(movements: ApiMovement[]): DashboardCharts['weeklyMovements'] {
	const labels = last7DayLabels();
	const today = new Date();
	const dayKeys = Array.from({ length: 7 }, (_, i) => {
		const d = new Date(today);
		d.setDate(d.getDate() - (6 - i));
		return d.toLocaleDateString('fr-FR');
	});

	const types = ['RECEPTION', 'EXPEDITION', 'QUARANTAINE', 'TRANSFORMATION'] as const;
	const buckets = new Map<string, Map<string, number>>();
	for (const type of types) {
		buckets.set(type, new Map(dayKeys.map((k) => [k, 0])));
	}

	for (const m of movements) {
		const type = m.type_action as (typeof types)[number];
		if (!buckets.has(type)) continue;
		const key = dayKey(m.created_at);
		const bucket = buckets.get(type)!;
		if (bucket.has(key)) bucket.set(key, (bucket.get(key) ?? 0) + 1);
	}

	const series = types
		.map((type) => ({
			name: MOVEMENT_LABELS[type] ?? type,
			color: MOVEMENT_COLORS[type] ?? '#94a3b8',
			data: dayKeys.map((k) => buckets.get(type)?.get(k) ?? 0)
		}))
		.filter((s) => s.data.some((v) => v > 0));

	return { labels, series };
}

function alertSeverityChart(alerts: ApiAlert[]): ChartSegment[] {
	const active = alerts.filter((a) => a.statut === 'ACTIVE');

	return countBy(active, (a) => a.niveau_gravite).map((s) => ({
		label: SEVERITY_LABELS[s.label] ?? s.label,
		value: s.value,
		color: SEVERITY_COLORS[s.label] ?? '#94a3b8'
	}));
}

// Ne compte QUE les contrôles réellement effectués. L'ancienne formule déduisait les conformes
// (lots − non conformes − en cours) : elle déclarait donc conforme tout lot jamais contrôlé —
// une conformité sanitaire affirmée que personne n'avait vérifiée.
function qualityResultsChart(qualityRows: ApiQualityControl[]): ChartSegment[] {
	return countBy(qualityRows, (q) => normalizeQualityResult(q.resultat)).map((s) => ({
		label: QUALITY_LABELS[s.label] ?? s.label,
		value: s.value,
		color: QUALITY_COLORS[s.label] ?? '#94a3b8'
	}));
}

export function buildDashboardCharts(
	batches: ApiBatch[],
	alerts: ApiAlert[],
	movements: ApiMovement[],
	qualityRows: ApiQualityControl[]
): DashboardCharts {
	return {
		lotStatus: lotStatusChart(batches),
		weeklyMovements: weeklyMovementsChart(movements),
		alertSeverity: alertSeverityChart(alerts),
		qualityResults: qualityResultsChart(qualityRows)
	};
}
