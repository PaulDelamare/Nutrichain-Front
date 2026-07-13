import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getAlerts } from '$lib/Api/organization.server';
import { countActiveColdAlerts } from '$lib/utils/org/mappers';

export const load: LayoutServerLoad = async ({ locals, url, fetch, cookies, depends }) => {
	if (!locals.user) {
		redirect(303, `/connexion?redirect=${encodeURIComponent(url.pathname)}`);
	}

	// SvelteKit ne rejoue un load que si une dépendance suivie a été LUE. Sans ces deux lignes,
	// le compte d'alertes est calculé une seule fois puis figé pour toute la session : l'en-tête
	// afficherait « 3 alertes froid » sur la page même qui dit « aucune alerte active ».
	void url.pathname; // → rejoué à chaque navigation
	depends('nutrichain:alerts'); // → rejouable après une action qui modifie les alertes

	const alerts = await getAlerts(fetch, cookies);

	return {
		user: locals.user,
		// Le badge n'affirme un chiffre que s'il a pu le vérifier.
		coldAlerts: alerts.ok ? countActiveColdAlerts(alerts.data) : null
	};
};
