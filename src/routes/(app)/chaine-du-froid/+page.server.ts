import type { PageServerLoad } from './$types';
import { getAlerts, getEquipment, getQuarantineBatches } from '$lib/Api/organization.server';
import { alertsToCold } from '$lib/utils/org/mappers';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const [alerts, equipment, quarantine] = await Promise.all([
		getAlerts(fetch, cookies),
		getEquipment(fetch, cookies),
		getQuarantineBatches(fetch, cookies)
	]);

	if (!alerts.ok || !equipment.ok) {
		return { incident: null, alerts: [], error: alerts.message || equipment.message };
	}

	// Les lots en quarantaine servent à relier l'alerte à son concret : leur absence n'empêche pas
	// d'afficher l'alerte (on n'échoue pas la page pour ça), elle laisse juste la liste vide.
	const { incident, rows } = alertsToCold(
		alerts.data,
		equipment.data,
		quarantine.ok ? quarantine.data : []
	);
	return { incident, alerts: rows };
};
