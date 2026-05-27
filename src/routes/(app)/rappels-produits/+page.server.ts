import type { PageServerLoad } from './$types';
import { loadApiOrMock } from '$lib/Api/load.server';
import { getAlerts } from '$lib/Api/organization.server';
import { alertsToRappels, mockRappels } from '$lib/utils/org/mappers';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const { data, source, error } = await loadApiOrMock(() => getAlerts(fetch, cookies), []);

	const rappels = source === 'api' ? alertsToRappels(data) : mockRappels;

	return {
		rappels: rappels.length > 0 ? rappels : mockRappels,
		source: rappels.length > 0 && source === 'api' ? 'api' : 'mock',
		error
	};
};
