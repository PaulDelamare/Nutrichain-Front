import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getAuditLogs } from '$lib/Api/organization.server';
import { verifyAudit } from '$lib/Api/audit.server';
import { auditLogsToRows } from '$lib/utils/org/mappers';
import { exigerAdministrateur, refusAdministration } from '$lib/server/guards';

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

export const load: PageServerLoad = async ({ fetch, cookies, locals, url }) => {
	exigerAdministrateur(locals.user, "Le journal d'audit");

	const p = url.searchParams;
	const page = parsePage(p.get('page'));
	const limit = parseLimit(p.get('limit'));
	// Filtres de colonnes portés par l'URL : la requête part filtrée à l'API (plus de recherche sur
	// la seule tranche reçue), et un lien filtré reste partageable / rechargeable.
	const action = p.get('action')?.trim() || undefined;
	const entity = p.get('entity')?.trim() || undefined;
	const entityId = p.get('entity_id')?.trim() || undefined;
	const from = p.get('from')?.trim() || undefined;
	const to = p.get('to')?.trim() || undefined;

	const logs = await getAuditLogs(fetch, cookies, {
		page,
		limit,
		action,
		entity,
		entityId,
		from,
		to
	});

	const filters = {
		action: action ?? 'tous',
		entity: entity ?? 'tous',
		entityId: entityId ?? '',
		from: from ?? '',
		to: to ?? ''
	};
	const meta = { filters, pageSize: limit, pageSizeOptions: [...PAGE_SIZE_OPTIONS] };

	if (!logs.ok) {
		return { rows: [], pagination: { ...emptyPagination, limit }, error: logs.message, ...meta };
	}

	return {
		rows: auditLogsToRows(logs.data.data),
		pagination: logs.data.pagination,
		error: null,
		...meta
	};
};

export const actions = {
	verify: async ({ fetch, cookies, locals }) => {
		const refus = refusAdministration(locals.user);
		if (refus) return fail(403, { verifyError: refus });

		const res = await verifyAudit(fetch, cookies);
		if (!res.ok) {
			return fail(res.status, { verifyError: res.message });
		}
		const r = res.data;
		if (typeof r?.valid !== 'boolean') {
			return fail(502, { verifyError: 'Réponse de vérification illisible.' });
		}
		return {
			verify: {
				valid: r.valid,
				rowsChecked: r.rowsChecked,
				brokenAtId: r.brokenAtId,
				brokenAtReason: r.brokenAtReason,
				expectedRowCount: r.expectedRowCount,
				actualRowCount: r.actualRowCount
			}
		};
	}
} satisfies Actions;
