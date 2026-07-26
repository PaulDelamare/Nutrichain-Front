import type { PageServerLoad } from './$types';
import { exigerAdministrateur } from '$lib/server/guards';

export const load: PageServerLoad = async ({ locals }) => {
	exigerAdministrateur(locals.user, 'Le suivi des intégrations');
	// Pas d’endpoint « statut connecteurs » côté API : on expose l’export EPCIS réel.
	return {};
};
