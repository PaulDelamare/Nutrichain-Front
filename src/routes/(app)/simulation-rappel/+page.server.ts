import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { getBatches, getBatchGenealogy } from '$lib/Api/traceability.server';

type LotOption = { id: string; produit: string };

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const res = await getBatches(fetch, cookies);

	if (!res.ok) {
		return { lots: [] as LotOption[], error: res.message };
	}

	return {
		lots: res.data.map((b) => ({
			id: b.id,
			produit: b.produit?.nom ?? b.id
		}))
	};
};

export const actions: Actions = {
	default: async ({ request, fetch, cookies }) => {
		const form = await request.formData();
		const lotId = String(form.get('lotId') ?? '').trim();

		if (!lotId) {
			return fail(400, { message: 'Sélectionnez un lot à simuler.' });
		}

		const res = await getBatchGenealogy(fetch, cookies, lotId);

		if (!res.ok) {
			return fail(res.status, { message: res.message });
		}

		const downstream = res.data.downstream.map((b) => ({
			id: b.id,
			produit: b.nom_produit,
			statut: b.statut
		}));

		return {
			simulated: true,
			sourceLotId: lotId,
			downstream
		};
	}
};
