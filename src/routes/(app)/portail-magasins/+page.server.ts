import type { PageServerLoad } from './$types';
import { getAlerts, getCustomers, getShipments } from '$lib/Api/organization.server';
import { buildPortailBrief, buildPortailStats } from '$lib/utils/org/mappers';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const [customers, shipments, alerts] = await Promise.all([
		getCustomers(fetch, cookies),
		getShipments(fetch, cookies),
		getAlerts(fetch, cookies)
	]);

	if (!alerts.ok) {
		return { storeStats: [], activeBrief: null, error: alerts.message };
	}

	const echecs = [customers, shipments].filter((r) => !r.ok);
	const panne = echecs.find((r) => r.status !== 403);

	return {
		storeStats:
			customers.ok && shipments.ok ? buildPortailStats(customers.data, shipments.data) : [],
		activeBrief: buildPortailBrief(alerts.data),
		statsRefuses: echecs.some((r) => r.status === 403),
		statsError: panne?.message
	};
};
