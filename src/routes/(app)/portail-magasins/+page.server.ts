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
	if (!alerts.ok) {
		return { storeStats: [], activeBrief: null, error: alerts.message };
	}

	// La liste des clients est réservée aux administrateurs (donnée personnelle). L'abandon global
	// masquait donc la CONSIGNE DE RETRAIT au rôle qualité — précisément celui qui en a besoin.
	// Les compteurs se dégradent seuls ; le brief ne dépend que des alertes.
	//
	// On distingue le REFUS (403) de la PANNE : sinon un 500 sur /customers afficherait « chiffres
	// indisponibles pour votre rôle » pendant une panne — l'inversion exacte du défaut qu'on corrige.
	const echecs = [customers, shipments].filter((r) => !r.ok);
	const panne = echecs.find((r) => r.status !== 403);

	return {
		storeStats:
			customers.ok && shipments.ok ? buildPortailStats(customers.data, shipments.data) : [],
		activeBrief: buildPortailBrief(alerts.data),
		// Un rôle sans droit n'a pas « perdu » les chiffres : ils ne lui sont pas destinés.
		statsRefuses: echecs.some((r) => r.status === 403),
		statsError: panne?.message
	};
};
