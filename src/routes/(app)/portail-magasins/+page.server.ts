import type { PageServerLoad } from './$types';
import { getAlerts, getCustomers, getShipments } from '$lib/Api/organization.server';
import { buildPortailBrief, buildPortailStats } from '$lib/utils/org/mappers';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const [customers, shipments, alerts] = await Promise.all([
		getCustomers(fetch, cookies),
		getShipments(fetch, cookies),
		getAlerts(fetch, cookies)
	]);

	// Si /alerts échoue, on NE PEUT PAS dire « aucune consigne active » : un rappel peut être en
	// cours. Sur la page destinée aux magasins, nier un rappel est le pire mensonge possible.
	if (!customers.ok || !shipments.ok || !alerts.ok) {
		const error = [customers, shipments, alerts].find((r) => !r.ok)?.message;
		return { storeStats: [], activeBrief: null, error };
	}

	return {
		storeStats: buildPortailStats(customers.data, shipments.data),
		activeBrief: buildPortailBrief(alerts.data)
	};
};
