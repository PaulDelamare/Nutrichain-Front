import type { PageServerLoad } from './$types';
import { getBatches, getGenealogy } from '$lib/Api/traceability.server';
import { genealogyToTraceSteps, mockTraceSteps } from '$lib/utils/org/mappers';

export const load: PageServerLoad = async ({ fetch, cookies, url }) => {
	const lotId = url.searchParams.get('lot');
	const batches = await getBatches(fetch, cookies);

	if (!batches.ok) {
		return {
			steps: mockTraceSteps,
			batches: [],
			lotId: null,
			source: 'mock' as const,
			error: batches.message
		};
	}

	// Liste des lots pour le sélecteur — la traçabilité se lit toujours POUR un lot donné.
	const batchOptions = batches.data.map((b) => ({
		id: b.id,
		nom: b.produit?.nom ?? 'Produit',
		statut: b.statut
	}));

	if (lotId) {
		const genealogy = await getGenealogy(fetch, cookies, lotId);
		if (genealogy.ok) {
			return {
				steps: genealogyToTraceSteps(
					genealogy.data,
					batches.data.find((b) => b.id === lotId)
				),
				batches: batchOptions,
				lotId,
				source: 'api' as const
			};
		}
	}

	// Aucun lot choisi (ou généalogie indisponible) → état vide, pas de tracé arbitraire.
	return { steps: null, batches: batchOptions, lotId: lotId ?? null, source: 'api' as const };
};
