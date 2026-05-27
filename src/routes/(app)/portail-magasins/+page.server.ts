import type { PageServerLoad } from './$types';
import { getAlerts, getCustomers, getShipments } from '$lib/Api/organization.server';
import { buildPortailBrief, buildPortailStats, mockBrief, mockStoreStats } from '$lib/utils/org/mappers';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const [customers, shipments, alerts] = await Promise.all([
		getCustomers(fetch, cookies),
		getShipments(fetch, cookies),
		getAlerts(fetch, cookies)
	]);

	if (customers.ok && shipments.ok) {
		const alertList = alerts.ok ? alerts.data : [];
		return {
			source: 'api' as const,
			storeStats: buildPortailStats(customers.data, shipments.data),
			activeBrief: alerts.ok ? buildPortailBrief(alertList) : mockBrief
		};
	}

	return {
		source: 'mock' as const,
		storeStats: mockStoreStats,
		activeBrief: mockBrief,
		error: customers.message || shipments.message
	};
};
