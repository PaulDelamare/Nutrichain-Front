import type { PageServerLoad } from './$types';
import { getBatches, getGenealogy } from '$lib/Api/traceability.server';
import { genealogyToGraph } from '$lib/utils/org/mappers';

export const load: PageServerLoad = async ({ fetch, cookies, url }) => {
	const lotId = url.searchParams.get('lot');
	const batches = await getBatches(fetch, cookies);

	if (!batches.ok) {
		return { graph: null, batches: [], lotId: null, error: batches.message };
	}

	// Liste des lots pour le sélecteur — la traçabilité se lit toujours POUR un lot donné.
	const batchOptions = batches.data.map((b) => ({
		id: b.id,
		nom: b.produit?.nom ?? 'Produit',
		lotNumber: b.lot_number ?? b.id.slice(0, 8),
		statut: b.statut
	}));

	if (lotId) {
		const genealogy = await getGenealogy(fetch, cookies, lotId);
		if (genealogy.ok) {
			return {
				graph: genealogyToGraph(
					genealogy.data,
					batches.data.find((b) => b.id === lotId)
				),
				batches: batchOptions,
				lotId
			};
		}
	}

	// Aucun lot choisi (ou généalogie indisponible) → état vide, pas de tracé arbitraire.
	return { graph: null, batches: batchOptions, lotId: lotId ?? null };
};
