import { fail } from '@sveltejs/kit';
import { refusDecisionQualite } from '$lib/server/guards';
import type { Actions, PageServerLoad } from './$types';
import { getRecalls } from '$lib/Api/organization.server';
import { getBatchList, triggerRecall } from '$lib/Api/traceability.server';
import { alertsToRappels } from '$lib/utils/org/mappers';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 25;
const emptyPagination = { page: 1, limit: DEFAULT_PAGE_SIZE, total: 0, totalPages: 0 };

/** Une page hors bornes (`?page=0`, `?page=abc`) est un lien copié de travers, pas une erreur 400. */
function parsePage(raw: string | null): number {
	const parsed = Number(raw);
	return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
}

/** `limit` est borné à la liste du sélecteur : un `?limit=999` copié retombe sur le défaut. */
function parseLimit(raw: string | null): number {
	const parsed = Number(raw);
	return (PAGE_SIZE_OPTIONS as readonly number[]).includes(parsed) ? parsed : DEFAULT_PAGE_SIZE;
}

export const load: PageServerLoad = async ({ fetch, cookies, url }) => {
	const p = url.searchParams;
	const page = parsePage(p.get('page'));
	const limit = parseLimit(p.get('limit'));
	// Filtres de colonnes portés par l'URL : la requête part filtrée à l'API (plus de parcours de
	// TOUTES les alertes côté front), et un lien filtré reste partageable / rechargeable.
	const q = p.get('q')?.trim() || undefined;
	const statut = p.get('statut')?.trim() || undefined;

	const [recalls, batches] = await Promise.all([
		getRecalls(fetch, cookies, { page, limit, q, statut }),
		getBatchList(fetch, cookies)
	]);

	const batchList = batches.ok ? batches.data : [];

	const filters = { q: q ?? '', statut: statut ?? 'tous' };
	const meta = { filters, pageSize: limit, pageSizeOptions: [...PAGE_SIZE_OPTIONS] };

	return {
		// Le tableau recense le WORKFLOW des rappels (déduit des alertes), filtré et paginé côté API.
		rappels: recalls.ok ? alertsToRappels(recalls.data.data) : [],
		pagination: recalls.ok ? recalls.data.pagination : { ...emptyPagination, limit },
		batches: batchList.filter((b) => !['BLOQUE', 'ALERTE'].includes(b.statut)),
		// L'état qui fait foi est celui des LOTS : une alerte résolue ne libère pas le lot. Cette liste
		// dit ce qui reste réellement immobilisé, avec un lien vers chaque fiche (cf. #122).
		lotsSousRappel: batchList.filter((b) => b.statut === 'ALERTE'),
		error: [recalls, batches].find((r) => !r.ok)?.message,
		...meta
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
