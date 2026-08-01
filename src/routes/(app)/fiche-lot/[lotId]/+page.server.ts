import { error, fail } from '@sveltejs/kit';
import { refusDecisionQualite } from '$lib/server/guards';
import type { Actions, PageServerLoad } from './$types';
import { getBatchById, releaseQuarantine, scrapBatch } from '$lib/Api/logistics.server';
import { getAuditLogs, getMovements } from '$lib/Api/organization.server';
import { getBatchList, getGenealogy, triggerRecall } from '$lib/Api/traceability.server';
import type { ApiBatch, ApiOrigin } from '$lib/Api/traceability.server';
import {
	auditLogsToBatchMouvements,
	batchToSheet,
	movementToBatchMouvement
} from '$lib/utils/lots/mapBatch';

async function loadOrigins(
	fetch: typeof globalThis.fetch,
	cookies: import('@sveltejs/kit').Cookies,
	lotId: string
): Promise<ApiOrigin[]> {
	const gen = await getGenealogy(fetch, cookies, lotId);
	return gen.ok ? (gen.data.origines ?? []) : [];
}

async function loadFromCatalog(
	fetch: typeof globalThis.fetch,
	cookies: import('@sveltejs/kit').Cookies,
	lotId: string
): Promise<ApiBatch | null> {
	const [list, movements] = await Promise.all([
		getBatchList(fetch, cookies, { search: lotId }),
		getMovements(fetch, cookies, { lotId, limit: 50 })
	]);

	if (!list.ok) return null;

	const batch = list.data.find((b) => b.id === lotId);
	if (!batch) return null;

	return {
		...batch,
		mouvements: movements.ok ? movements.data.map(movementToBatchMouvement) : []
	};
}

async function enrichBatch(
	fetch: typeof globalThis.fetch,
	cookies: import('@sveltejs/kit').Cookies,
	batch: ApiBatch,
	lotId: string
): Promise<ApiBatch> {
	// `getBatchById` joint déjà les mouvements (avec metadata). Les recharger pour les jeter
	// (metadata: null) vidait la frise du motif de levée alors que la décision était en base (#30).
	if (batch.mouvements && batch.mouvements.length > 0) {
		return batch;
	}

	const [movements, audit] = await Promise.all([
		getMovements(fetch, cookies, { lotId, limit: 50 }),
		getAuditLogs(fetch, cookies, 100)
	]);

	const fromMovements = movements.ok ? movements.data.map(movementToBatchMouvement) : [];
	const fromAudit =
		audit.ok && fromMovements.length === 0
			? auditLogsToBatchMouvements(
					audit.data.filter((l) => l.entity === 'Batch' && l.entity_id === lotId)
				)
			: [];

	const mergedEvents = fromMovements.length > 0 ? fromMovements : fromAudit;

	return {
		...batch,
		mouvements: mergedEvents.length > 0 ? mergedEvents : []
	};
}

export const load: PageServerLoad = async ({ fetch, cookies, params }) => {
	const [res, origines] = await Promise.all([
		getBatchById(fetch, cookies, params.lotId),
		loadOrigins(fetch, cookies, params.lotId)
	]);

	if (res.ok) {
		const enriched = await enrichBatch(fetch, cookies, res.data, params.lotId);
		return { sheet: batchToSheet(enriched), origines, source: 'api' as const };
	}

	const fromCatalog = await loadFromCatalog(fetch, cookies, params.lotId);
	if (fromCatalog) {
		const enriched = await enrichBatch(fetch, cookies, fromCatalog, params.lotId);
		return { sheet: batchToSheet(enriched), origines, source: 'api' as const };
	}

	if (res.status === 404) {
		error(404, { message: `Le lot « ${params.lotId} » est introuvable.` });
	}
	if (res.status === 403) {
		error(403, { message: res.message || 'Accès refusé à ce lot.' });
	}
	error(res.status, { message: res.message });
};

export const actions = {
	release: async ({ request, fetch, cookies, params, locals }) => {
		const refus = refusDecisionQualite(locals.user);
		if (refus) return fail(403, { releaseError: refus });

		const motif = String((await request.formData()).get('motif') ?? '').trim();
		if (motif.length < 3) {
			return fail(400, { releaseError: 'Motif de levée requis (au moins 3 caractères).' });
		}
		const res = await releaseQuarantine(fetch, cookies, params.lotId, motif);
		if (!res.ok) return fail(res.status, { releaseError: res.message });
		return { released: true };
	},

	/**
	 * Sortie définitive du lot. Même garde qualité que la levée : ce n'est pas de la manutention,
	 * c'est la décision de détruire de la marchandise, et elle est scellée dans l'audit.
	 */
	scrap: async ({ request, fetch, cookies, params, locals }) => {
		const refus = refusDecisionQualite(locals.user);
		if (refus) return fail(403, { scrapError: refus });

		const motif = String((await request.formData()).get('motif') ?? '').trim();
		if (motif.length < 3) {
			return fail(400, { scrapError: 'Motif de mise au rebut requis (au moins 3 caractères).' });
		}
		const res = await scrapBatch(fetch, cookies, params.lotId, motif);
		if (!res.ok) return fail(res.status, { scrapError: res.message });
		return { scrapped: true };
	},

	recall: async ({ request, fetch, cookies, params, locals }) => {
		const refus = refusDecisionQualite(locals.user);
		if (refus) return fail(403, { recallError: refus });

		const reason = String((await request.formData()).get('reason') ?? '').trim();
		if (reason.length < 3) {
			return fail(400, { recallError: 'Motif de rappel requis (au moins 3 caractères).' });
		}
		const res = await triggerRecall(fetch, cookies, params.lotId, reason);
		if (!res.ok) return fail(res.status, { recallError: res.message });
		return { recall: res.data };
	}
} satisfies Actions;
