import { error, fail } from '@sveltejs/kit';
import { refusDecisionQualite } from '$lib/server/guards';
import type { Actions, PageServerLoad } from './$types';
import { getBatchById, releaseQuarantine } from '$lib/Api/logistics.server';
import { getMovements } from '$lib/Api/organization.server';
import { getBatches, getGenealogy, triggerRecall } from '$lib/Api/traceability.server';
import type { ApiBatch, ApiOrigin } from '$lib/Api/traceability.server';
import { batchToSheet } from '$lib/utils/lots/mapBatch';

// L'amont (fournisseurs d'origine) ne doit jamais faire échouer la fiche : dégradation silencieuse.
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
		getBatches(fetch, cookies),
		getMovements(fetch, cookies, { lotId, limit: 10 })
	]);

	if (!list.ok) return null;

	const batch = list.data.find((b) => b.id === lotId);
	if (!batch) return null;

	return {
		...batch,
		mouvements: movements.ok ? movements.data : []
	};
}

export const load: PageServerLoad = async ({ fetch, cookies, params }) => {
	const [res, origines] = await Promise.all([
		getBatchById(fetch, cookies, params.lotId),
		loadOrigins(fetch, cookies, params.lotId)
	]);

	if (res.ok) {
		return { sheet: batchToSheet(res.data), origines, source: 'api' as const };
	}

	const fromCatalog = await loadFromCatalog(fetch, cookies, params.lotId);
	if (fromCatalog) {
		return { sheet: batchToSheet(fromCatalog), origines, source: 'api' as const };
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
	// Lever la quarantaine du lot (décision qualité) directement depuis sa fiche.
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

	// Déclencher un rappel produit à partir du lot (bloque le lot et sa descendance).
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
