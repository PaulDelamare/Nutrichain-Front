import { numeroLot } from '$lib/utils/lots/lotLabel';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { resolveBatchByLotNumber } from '$lib/Api/logistics.server';
import { getBatches } from '$lib/Api/traceability.server';

export const load: PageServerLoad = async () => {
	return {};
};

export const actions = {
	resolve: async ({ request, fetch, cookies }) => {
		const code = String((await request.formData()).get('code') ?? '').trim();
		if (!code) {
			return fail(400, {
				resolveError: 'Saisissez un numéro de lot ou un GTIN.',
				code: '',
				candidates: [] as { id: string; lotNumber: string; produit: string; gtin: string }[]
			});
		}

		// 1) Résolution exacte par lot_number (canal mobile / GS1 AI 10).
		const byLot = await resolveBatchByLotNumber(fetch, cookies, code);
		if (byLot.ok) {
			redirect(303, `/fiche-lot/${encodeURIComponent(byLot.data.id)}`);
		}

		// 2) Recherche catalogue (GTIN ou fragment) — un seul hit → fiche.
		const search = await getBatches(fetch, cookies, { search: code, limit: 20 });
		if (search.ok && search.data.data.length === 1) {
			redirect(303, `/fiche-lot/${encodeURIComponent(search.data.data[0].id)}`);
		}
		if (search.ok && search.data.data.length > 1) {
			return fail(409, {
				resolveError: 'Plusieurs lots correspondent — précisez le numéro de lot GS1.',
				code,
				candidates: search.data.data.map((b) => ({
					id: b.id,
					lotNumber: numeroLot(b),
					produit: b.produit?.nom ?? '—',
					gtin: b.produit?.code_gtin ?? '—'
				}))
			});
		}

		return fail(404, {
			resolveError: byLot.message || 'Aucun lot ne correspond à ce code.',
			code,
			candidates: []
		});
	}
} satisfies Actions;
