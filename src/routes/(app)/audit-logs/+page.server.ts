import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { loadApiOrMock } from '$lib/Api/load.server';
import { getAuditLogs } from '$lib/Api/organization.server';
import { verifyAudit } from '$lib/Api/audit.server';
import { auditLogsToRows } from '$lib/utils/org/mappers';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const { data, source, error } = await loadApiOrMock(() => getAuditLogs(fetch, cookies, 50), []);

	return {
		rows: source === 'api' ? auditLogsToRows(data) : [],
		source,
		error
	};
};

export const actions = {
	verify: async ({ fetch, cookies }) => {
		const res = await verifyAudit(fetch, cookies);
		if (!res.ok) {
			return fail(res.status, { verifyError: res.message });
		}
		const r = res.data;
		// Réponse malformée → message neutre plutôt qu'un faux « chaîne compromise ».
		if (typeof r?.valid !== 'boolean') {
			return fail(502, { verifyError: 'Réponse de vérification illisible.' });
		}
		// On ne renvoie au client que les champs affichés (moindre exposition).
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
