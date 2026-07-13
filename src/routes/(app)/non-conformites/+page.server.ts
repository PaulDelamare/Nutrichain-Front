import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getQualityControls, getQuarantineBatches } from '$lib/Api/organization.server';
import { releaseQuarantine } from '$lib/Api/logistics.server';
import { batchesToQuarantine, qualityToNc } from '$lib/utils/org/mappers';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const [quality, quarantine] = await Promise.all([
		getQualityControls(fetch, cookies),
		getQuarantineBatches(fetch, cookies)
	]);

	const error = [quality, quarantine].find((r) => !r.ok)?.message;

	if (error) {
		return { openNc: [], quarantineLots: [], error };
	}

	return {
		openNc: qualityToNc(quality.ok ? quality.data : []),
		quarantineLots: batchesToQuarantine(quarantine.ok ? quarantine.data : [])
	};
};

export const actions = {
	release: async ({ request, fetch, cookies }) => {
		const form = await request.formData();
		const lotId = String(form.get('lotId') ?? '').trim();
		const motif = String(form.get('motif') ?? '').trim();

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
	}
} satisfies Actions;
