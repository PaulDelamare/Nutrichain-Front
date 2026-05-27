import type { PageServerLoad } from './$types';
import { loadApiOrMock } from '$lib/Api/load.server';
import { getAuditLogs } from '$lib/Api/organization.server';
import { auditToConnectors, mockConnectors } from '$lib/utils/org/mappers';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const { data, source, error } = await loadApiOrMock(
		() => getAuditLogs(fetch, cookies, 10),
		[]
	);

	return {
		connectors: source === 'api' ? auditToConnectors(data) : mockConnectors,
		source,
		error
	};
};
