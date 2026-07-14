import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getAuditLogs } from '$lib/Api/organization.server';
import { verifyAudit } from '$lib/Api/audit.server';
import { auditLogsToRows } from '$lib/utils/org/mappers';
import { exigerAdministrateur, refusAdministration } from '$lib/server/guards';

export const load: PageServerLoad = async ({ fetch, cookies, locals }) => {
	exigerAdministrateur(locals.user, "Le journal d'audit");

	const logs = await getAuditLogs(fetch, cookies, 50);

	if (!logs.ok) {
		return { rows: [], error: logs.message };
	}

	return { rows: auditLogsToRows(logs.data) };
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
