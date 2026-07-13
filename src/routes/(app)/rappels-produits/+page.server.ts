import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getAlerts } from '$lib/Api/organization.server';
import { getBatches, triggerRecall } from '$lib/Api/traceability.server';
import { alertsToRappels } from '$lib/utils/org/mappers';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const [alerts, batches] = await Promise.all([
		getAlerts(fetch, cookies),
		getBatches(fetch, cookies)
	]);

	return {
		rappels: alerts.ok ? alertsToRappels(alerts.data) : [],
		// Lots encore rappelables (un lot déjà bloqué/en alerte n'est pas re-rappelable)
		batches: batches.ok ? batches.data.filter((b) => !['BLOQUE', 'ALERTE'].includes(b.statut)) : [],
		error: [alerts, batches].find((r) => !r.ok)?.message
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
