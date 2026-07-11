import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { loadApiOrMock } from '$lib/Api/load.server';
import { getAlerts } from '$lib/Api/organization.server';
import { getBatches, triggerRecall } from '$lib/Api/traceability.server';
import { alertsToRappels, mockRappels } from '$lib/utils/org/mappers';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const [{ data, source, error }, batches] = await Promise.all([
		loadApiOrMock(() => getAlerts(fetch, cookies), []),
		getBatches(fetch, cookies)
	]);

	const rappels = source === 'api' ? alertsToRappels(data) : mockRappels;

	return {
		rappels: rappels.length > 0 ? rappels : mockRappels,
		// Lots encore rappelables (un lot déjà bloqué/en alerte n'est pas re-rappelable)
		batches: batches.ok ? batches.data.filter((b) => !['BLOQUE', 'ALERTE'].includes(b.statut)) : [],
		source: rappels.length > 0 && source === 'api' ? 'api' : 'mock',
		error
	};
};

export const actions = {
	recall: async ({ request, fetch, cookies }) => {
		const form = await request.formData();
		const lotId = String(form.get('lotId') ?? '').trim();
		const reason = String(form.get('reason') ?? '').trim();

		if (!lotId || !reason) {
			return fail(400, { error: 'Lot et motif obligatoires.', lotId, reason });
		}

		const res = await triggerRecall(fetch, cookies, lotId, reason);

		if (!res.ok) {
			return fail(res.status, { error: res.message, lotId, reason });
		}

		return { recall: res.data, lotId };
	}
} satisfies Actions;
