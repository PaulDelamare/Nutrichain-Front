import type { PageServerLoad } from './$types';
import { getBatches } from '$lib/Api/traceability.server';
import {
	getAlerts,
	getQualityControls,
	getQuarantineBatches,
	getMovements
} from '$lib/Api/organization.server';
import { buildDashboardKpis, buildDashboardTasks, movementsToEvents } from '$lib/utils/org/mappers';
import { buildDashboardCharts } from '$lib/utils/org/dashboardCharts';
import { openQualityIssues } from '$lib/utils/org/quality';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const [batches, alerts, quality, quarantine, movements] = await Promise.all([
		getBatches(fetch, cookies),
		getAlerts(fetch, cookies),
		getQualityControls(fetch, cookies),
		getQuarantineBatches(fetch, cookies),
		getMovements(fetch, cookies, { limit: 100 })
	]);

	const batchList = batches.ok ? batches.data : [];
	const cappedAt100 = batches.ok && batchList.length >= 100;
	const alertList = alerts.ok ? alerts.data : [];
	const qualityList = quality.ok ? quality.data : [];
	const quarantineList = quarantine.ok ? quarantine.data : [];
	const movementList = movements.ok ? movements.data : [];

	const error = [batches, alerts, quality, quarantine, movements].find((r) => !r.ok)?.message;

	const openIssues = openQualityIssues(qualityList).length;

	return {
		kpis: buildDashboardKpis(
			batchList.length,
			alertList,
			openIssues,
			quarantineList.length,
			cappedAt100
		),
		charts: buildDashboardCharts(batchList, alertList, movementList, qualityList),
		recentEvents: movementsToEvents(movementList.slice(0, 5)),
		tasks: buildDashboardTasks(alertList, openIssues),
		error
	};
};
