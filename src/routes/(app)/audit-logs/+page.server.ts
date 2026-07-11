import type { PageServerLoad } from './$types';
import { loadApiOrMock } from '$lib/Api/load.server';
import { getAuditLogs } from '$lib/Api/organization.server';
import { auditLogsToRows } from '$lib/utils/org/mappers';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const { data, source, error } = await loadApiOrMock(() => getAuditLogs(fetch, cookies, 50), []);

	return {
		rows: source === 'api' ? auditLogsToRows(data) : [],
		source,
		error
	};
};
