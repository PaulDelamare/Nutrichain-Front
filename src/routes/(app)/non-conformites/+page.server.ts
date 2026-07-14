import { fail } from '@sveltejs/kit';
import { refusDecisionQualite } from '$lib/server/guards';
import type { Actions, PageServerLoad } from './$types';
import {
	createQualityControl,
	getPendingQualityControl,
	getQualityControls,
	getQuarantineBatches
} from '$lib/Api/organization.server';
import { releaseQuarantine } from '$lib/Api/logistics.server';
import { batchesToQuarantine, qualityToNc } from '$lib/utils/org/mappers';
import { pendingQcToLots } from '$lib/utils/org/pendingQc';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const [quality, quarantine, pending] = await Promise.all([
		getQualityControls(fetch, cookies),
		getQuarantineBatches(fetch, cookies),
		getPendingQualityControl(fetch, cookies)
	]);

	const error = [quality, quarantine, pending].find((r) => !r.ok)?.message;

	if (error) {
		return { openNc: [], quarantineLots: [], pendingQc: [], error };
	}

	return {
		openNc: qualityToNc(quality.ok ? quality.data : []),
		quarantineLots: batchesToQuarantine(quarantine.ok ? quarantine.data : []),
		pendingQc: pendingQcToLots(pending.ok ? pending.data : [])
	};
};

export const actions = {
	release: async ({ request, fetch, cookies, locals }) => {
		const form = await request.formData();
		const lotId = String(form.get('lotId') ?? '').trim();
		const motif = String(form.get('motif') ?? '').trim();

		const refus = refusDecisionQualite(locals.user);
		if (refus) return fail(403, { releaseError: refus, lotId });

		if (!lotId || motif.length < 3) {
			return fail(400, {
				releaseError: 'Motif de levée requis (au moins 3 caractères).',
				lotId
			});
		}

		const res = await releaseQuarantine(fetch, cookies, lotId, motif);
		if (!res.ok) {
			return fail(res.status, { releaseError: res.message, lotId });
		}

		return { released: lotId };
	},

	// Barrière qualité : le contrôle libère le lot (conforme) ou le met en quarantaine (non conforme).
	control: async ({ request, fetch, cookies, locals }) => {
		exigerDecisionQualite(locals.user, "La saisie d'un contrôle qualité");

		const form = await request.formData();
		const lotId = String(form.get('lotId') ?? '').trim();
		const typeTest = String(form.get('typeTest') ?? '').trim();
		const resultat = String(form.get('resultat') ?? '');
		const notes = String(form.get('notes') ?? '').trim();

		if (typeTest.length < 3) {
			return fail(400, {
				controlError: 'Type de test requis (au moins 3 caractères).',
				controlLotId: lotId
			});
		}

		if (resultat !== 'CONFORME' && resultat !== 'NON_CONFORME') {
			return fail(400, { controlError: 'Résultat invalide.', controlLotId: lotId });
		}

		const res = await createQualityControl(fetch, cookies, {
			id_lot: lotId,
			type_test: typeTest,
			resultat,
			notes: notes || undefined
		});

		if (!res.ok) {
			return fail(res.status, { controlError: res.message, controlLotId: lotId });
		}

		return { controlled: lotId, statutLot: res.data.statut_lot };
	}
} satisfies Actions;
