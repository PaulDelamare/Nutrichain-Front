import type { PageServerLoad } from './$types';
import { getAlerts, getEquipment } from '$lib/Api/organization.server';
import { alertsToCold } from '$lib/utils/org/mappers';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const [alerts, equipment] = await Promise.all([
		getAlerts(fetch, cookies),
		getEquipment(fetch, cookies)
	]);

	if (!alerts.ok || !equipment.ok) {
		return { incident: null, alerts: [], error: alerts.message || equipment.message };
	}

	const { incident, rows } = alertsToCold(alerts.data, equipment.data);
	return { incident, alerts: rows };
};
