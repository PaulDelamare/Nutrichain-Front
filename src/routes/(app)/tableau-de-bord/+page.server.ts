import type { PageServerLoad } from './$types';
import { getBatches } from '$lib/Api/traceability.server';
import { getAlerts, getQualityControls, getQuarantineBatches, getMovements } from '$lib/Api/organization.server';
import {
	buildDashboardKpis,
	buildDashboardTasks,
	movementsToEvents,
	mockEvents,
	mockKpis,
	mockTasks
} from '$lib/utils/org/mappers';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const [batches, alerts, quality, quarantine, movements] = await Promise.all([
		getBatches(fetch, cookies),
		getAlerts(fetch, cookies),
		getQualityControls(fetch, cookies),
		getQuarantineBatches(fetch, cookies),
		getMovements(fetch, cookies, { limit: 5 })
	]);

	const batchList = batches.ok ? batches.data : [];
	const alertList = alerts.ok ? alerts.data : [];
	const qualityList = quality.ok ? quality.data : [];
	const quarantineList = quarantine.ok ? quarantine.data : [];
	const movementList = movements.ok ? movements.data : [];

	const source =
		batches.ok && alerts.ok ? ('api' as const) : ('mock' as const);

	return {
		source,
		kpis:
			batches.ok && alerts.ok
				? buildDashboardKpis(batchList.length, alertList, qualityList.length, quarantineList.length)
				: mockKpis,
		recentEvents: movementList.length > 0 ? movementsToEvents(movementList) : mockEvents,
		tasks: alerts.ok ? buildDashboardTasks(alertList, qualityList.length) : mockTasks
	};
};
