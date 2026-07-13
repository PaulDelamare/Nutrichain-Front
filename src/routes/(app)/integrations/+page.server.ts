import type { PageServerLoad } from './$types';
import { getAuditLogs } from '$lib/Api/organization.server';
import { auditToConnectors } from '$lib/utils/org/mappers';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const logs = await getAuditLogs(fetch, cookies, 10);

	if (!logs.ok) {
		return { connectors: [], error: logs.message };
	}

	return { connectors: auditToConnectors(logs.data) };
};
