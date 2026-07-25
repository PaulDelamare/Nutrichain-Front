import type { PageServerLoad } from './$types';
import type { Connector } from '$lib/types/integration';
import { exigerAdministrateur } from '$lib/server/guards';

export const load: PageServerLoad = async ({ locals }) => {
	exigerAdministrateur(locals.user, 'Le suivi des intégrations');
	return { connectors: [] as Connector[] };
};
