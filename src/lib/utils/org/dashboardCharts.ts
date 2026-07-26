import type { ApiAlert, ApiMovement, ApiQualityControl } from '$lib/Api/organization.server';
import type { ApiBatch } from '$lib/Api/traceability.server';
import type { ChartSegment, DashboardCharts } from '$lib/types/dashboard-charts';
import {
	MOVEMENT_CHART_COLORS,
	MOVEMENT_CHART_LABELS,
	MOVEMENT_CHART_TYPES,
	normalizeMovementType,
	type MovementChartType
} from '$lib/utils/movements/labels';
import {
	alertSeverityColor,
	alertSeverityLabel,
	normalizeAlertSeverity
} from '$lib/vocab/alertSeverity';
import { batchStatusColor, batchStatusLabel } from '$lib/vocab/batchStatus';
import { normalizeQualityResult } from './quality';

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
		label: batchStatusLabel(s.label),
		value: s.value,
		color: batchStatusColor(s.label)
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

	const buckets = new Map<MovementChartType, Map<string, number>>();
	for (const type of MOVEMENT_CHART_TYPES) {
		buckets.set(type, new Map(dayKeys.map((k) => [k, 0])));
	}

	for (const m of movements) {
		const type = normalizeMovementType(m.type_action);
		const key = dayKey(m.created_at);
		const bucket = buckets.get(type)!;
		if (bucket.has(key)) bucket.set(key, (bucket.get(key) ?? 0) + 1);
	}

	const series = MOVEMENT_CHART_TYPES.map((type) => ({
		name: MOVEMENT_CHART_LABELS[type],
		color: MOVEMENT_CHART_COLORS[type],
		data: dayKeys.map((k) => buckets.get(type)?.get(k) ?? 0)
	})).filter((s) => s.data.some((v) => v > 0));

	return { labels, series };
}

function alertSeverityChart(alerts: ApiAlert[]): ChartSegment[] {
	const active = alerts.filter((a) => a.statut === 'ACTIVE');

	return countBy(active, (a) => normalizeAlertSeverity(a.niveau_gravite)).map((s) => ({
		label: alertSeverityLabel(s.label),
		value: s.value,
		color: alertSeverityColor(s.label)
	}));
}

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
