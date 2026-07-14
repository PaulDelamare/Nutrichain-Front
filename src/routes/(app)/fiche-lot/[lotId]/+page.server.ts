import { error, fail } from '@sveltejs/kit';
import { refusDecisionQualite } from '$lib/server/guards';
import type { Actions, PageServerLoad } from './$types';
import { getBatchById, releaseQuarantine } from '$lib/Api/logistics.server';
import { getAuditLogs, getMovements } from '$lib/Api/organization.server';
import { getBatches, getGenealogy, triggerRecall } from '$lib/Api/traceability.server';
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
		getBatches(fetch, cookies, { search: lotId }),
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
	const [movements, audit] = await Promise.all([
		getMovements(fetch, cookies, { lotId, limit: 50 }),
		getAuditLogs(fetch, cookies, 100)
	]);

	const fromMovements = movements.ok ? movements.data.map(movementToBatchMouvement) : [];
	const fromAudit =
		audit.ok && fromMovements.length < 3
			? auditLogsToBatchMouvements(
					audit.data.filter((l) => l.entity === 'Batch' && l.entity_id === lotId)
				)
			: [];

	const mergedEvents = fromMovements.length > 0 ? fromMovements : fromAudit;

	return {
		...batch,
		mouvements: mergedEvents.length > 0 ? mergedEvents : (batch.mouvements ?? [])
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
