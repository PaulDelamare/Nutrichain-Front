import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { getBatchList, getGenealogy, getRecallSimulation } from '$lib/Api/traceability.server';
import { libelleLotRappel, numeroLot } from '$lib/utils/lots/lotLabel';

type LotOption = { id: string; label: string };

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const res = await getBatchList(fetch, cookies);

	if (!res.ok) {
		return { lots: [] as LotOption[], error: res.message };
	}

	// Le libellé est composé ICI, avec la MÊME fonction que l'écran de déclenchement (#80) : on
	// simule et on déclenche sur la même lecture. La projection précédente gardait `{ id, produit }`
	// en perdant `lot_number` — le sélecteur affichait donc des UUID, et deux lots du même produit y
	// étaient indiscernables.
	//
	// On projette au lieu de passer les lots bruts : tout ce qui sort d'ici part dans la charge SSR,
	// et l'écran n'a besoin que d'un identifiant et d'un libellé. Y laisser l'objet complet
	// exposerait au navigateur l'auteur du lot, son e-mail et la référence de réception.
	return { lots: res.data.map((b) => ({ id: b.id, label: libelleLotRappel(b) })) };
};

export const actions: Actions = {
	default: async ({ request, fetch, cookies }) => {
		const form = await request.formData();
		const lotId = String(form.get('lotId') ?? '').trim();

		if (!lotId) {
			return fail(400, { message: 'Sélectionnez un lot à simuler.' });
		}

		// L'impact vient de l'API, qui applique la règle du rappel réel en lecture seule. La
		// généalogie ne sert plus qu'à NOMMER les lots descendants : elle ne décide plus du compte, qui
		// s'en dérivait alors qu'elle est plafonnée à 1000 lots — au-delà, l'écran sous-déclarait.
		const [simulation, genealogy] = await Promise.all([
			getRecallSimulation(fetch, cookies, lotId),
			getGenealogy(fetch, cookies, lotId)
		]);

		if (!simulation.ok) {
			return fail(simulation.status, { message: simulation.message });
		}

		// Le numéro de lot voyage jusqu'au résultat : corriger le seul sélecteur aurait laissé
		// l'opérateur choisir un lot lisible pour relire ensuite une liste d'UUID (#80).
		const downstream = genealogy.ok
			? genealogy.data.downstream.map((b) => ({
					id: b.id,
					lotNumber: numeroLot(b),
					produit: b.nom_produit,
					statut: b.statut
				}))
			: [];

		return {
			simulated: true,
			sourceLotId: lotId,
			impactedCount: simulation.data.impactedCount,
			affectedShipments: simulation.data.affectedShipments,
			affectedShipmentsTruncated: simulation.data.affectedShipmentsTruncated,
			affectedShipmentsCount: simulation.data.affectedShipmentsCount,
			depthSaturated: simulation.data.depthSaturated,
			// La liste des descendants est plafonnée à 1000 par l'API de généalogie : sans ce
			// drapeau, l'écart avec `impactedCount` passerait pour une incohérence de l'application.
			downstreamPartial: simulation.data.impactedCount - 1 > downstream.length,
			downstream
		};
	}
};
