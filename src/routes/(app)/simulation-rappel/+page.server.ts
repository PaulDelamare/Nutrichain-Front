import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { getBatches, getBatchGenealogy } from '$lib/Api/traceability.server';
import { lots as mockLots } from '$lib/data/lot-search';

type LotOption = { id: string; produit: string };

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const res = await getBatches(fetch, cookies);

	if (res.ok) {
		return {
			lots: res.data.map((b) => ({ id: b.id, produit: b.produit?.nom ?? b.id })) as LotOption[],
			source: 'api' as const
		};
	}

	return {
		lots: mockLots.map((l) => ({ id: l.id, produit: l.produit })) as LotOption[],
		source: 'mock' as const,
		error: res.message
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

		if (res.ok) {
			const downstream = res.data.downstream.map((b) => ({
				id: b.id,
				produit: b.nom_produit,
				statut: b.statut
			}));

			return {
				simulated: true,
				source: 'api' as const,
				sourceLotId: lotId,
				downstream
			};
		}

		// Repli non destructif : impact estimé fictif pour la démonstration hors-ligne.
		return {
			simulated: true,
			source: 'mock' as const,
			sourceLotId: lotId,
			error: res.message,
			downstream: [
				{ id: `${lotId}-T1`, produit: 'Produit transformé (estimation)', statut: 'EN_STOCK' },
				{ id: `${lotId}-T2`, produit: 'Produit fini (estimation)', statut: 'EXPEDIE' }
			]
		};
	}
};
