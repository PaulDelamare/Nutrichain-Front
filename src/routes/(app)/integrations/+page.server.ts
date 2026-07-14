import type { PageServerLoad } from './$types';
import { getAuditLogs } from '$lib/Api/organization.server';
import { auditToConnectors } from '$lib/utils/org/mappers';
import { exigerAdministrateur } from '$lib/server/guards';

export const load: PageServerLoad = async ({ fetch, cookies, locals }) => {
	// La page est bâtie sur le journal d'audit, réservé aux administrateurs (donnée personnelle).
	exigerAdministrateur(locals.user, 'Le suivi des intégrations');

	const logs = await getAuditLogs(fetch, cookies, 10);

	if (!logs.ok) {
		return { connectors: [], error: logs.message };
	}

	return { connectors: auditToConnectors(logs.data) };
};
