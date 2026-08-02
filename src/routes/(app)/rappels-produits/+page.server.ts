import { fail } from '@sveltejs/kit';
import { refusDecisionQualite } from '$lib/server/guards';
import type { Actions, PageServerLoad } from './$types';
import { getAlerts } from '$lib/Api/organization.server';
import { getBatchList, triggerRecall } from '$lib/Api/traceability.server';
import { alertsToRappels } from '$lib/utils/org/mappers';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const [alerts, batches] = await Promise.all([
		getAlerts(fetch, cookies),
		getBatchList(fetch, cookies)
	]);

	const batchList = batches.ok ? batches.data : [];

	return {
		rappels: alerts.ok ? alertsToRappels(alerts.data) : [],
		batches: batchList.filter((b) => !['BLOQUE', 'ALERTE'].includes(b.statut)),
		// L'état qui fait foi est celui des LOTS. Les cartes ci-dessus se déduisent des alertes, et
		// une alerte résolue — ou purgée — faisait disparaître le rappel de l'écran pendant que la
		// marchandise restait immobilisée.
		lotsSousRappel: batchList.filter((b) => b.statut === 'ALERTE'),
		error: [alerts, batches].find((r) => !r.ok)?.message
	};
};

export const actions = {
	recall: async ({ request, fetch, cookies, locals }) => {
		const form = await request.formData();
		const lotId = String(form.get('lotId') ?? '').trim();
		const reason = String(form.get('reason') ?? '').trim();

		const refus = refusDecisionQualite(locals.user);
		if (refus) return fail(403, { error: refus, lotId, reason });

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
