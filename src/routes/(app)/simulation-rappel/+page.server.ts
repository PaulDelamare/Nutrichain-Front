import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { getBatchList, getGenealogy } from '$lib/Api/traceability.server';
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

		const res = await getGenealogy(fetch, cookies, lotId);

		if (!res.ok) {
			return fail(res.status, { message: res.message });
		}

		// Le numéro de lot voyage jusqu'au résultat : corriger le seul sélecteur aurait laissé
		// l'opérateur choisir un lot lisible pour relire ensuite une liste d'UUID (#80).
		const downstream = res.data.downstream.map((b) => ({
			id: b.id,
			lotNumber: numeroLot(b),
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
