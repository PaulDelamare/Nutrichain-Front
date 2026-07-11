import type { PageServerLoad } from './$types';
import { getAlerts, getEquipment } from '$lib/Api/organization.server';
import { alertsToCold, mockColdAlerts, mockColdIncident } from '$lib/utils/org/mappers';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const [alerts, equipment] = await Promise.all([
		getAlerts(fetch, cookies),
		getEquipment(fetch, cookies)
	]);

	if (alerts.ok && equipment.ok) {
		const { incident, rows } = alertsToCold(alerts.data, equipment.data);
		return {
			source: 'api' as const,
			incident: incident ?? mockColdIncident,
			alerts: rows.length > 0 ? rows : mockColdAlerts
		};
	}

	return {
		source: 'mock' as const,
		incident: mockColdIncident,
		alerts: mockColdAlerts,
		error: alerts.message || equipment.message
	};
};
