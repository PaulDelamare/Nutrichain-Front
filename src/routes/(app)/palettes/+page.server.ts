import type { PageServerLoad } from './$types';
import { getLogisticUnitBySscc } from '$lib/Api/logistics.server';
import { getEquipment } from '$lib/Api/organization.server';
import { normaliserSscc } from '$lib/utils/palettes/sscc';
import type { ResultatPalette } from '$lib/types/palette';

export const load: PageServerLoad = async ({ fetch, cookies, url }) => {
	const saisie = url.searchParams.get('sscc')?.trim() ?? '';

	if (!saisie) {
		return { resultat: { etat: 'vide' } as ResultatPalette, saisie };
	}

	const sscc = normaliserSscc(saisie);
	if (!sscc) {
		return { resultat: { etat: 'invalide', saisie } as ResultatPalette, saisie };
	}

	const res = await getLogisticUnitBySscc(fetch, cookies, sscc);

	if (!res.ok) {
		// On ne rend PAS une palette vide sur une panne : un écran sans lot la ferait passer pour
		// une palette qui ne porte plus rien, et elle serait traitée comme telle.
		return {
			resultat: { etat: 'erreur', saisie, message: res.message } as ResultatPalette,
			saisie
		};
	}

	// Le nom du frigo, pas son identifiant : « rangée » sans dire OÙ ne permet pas à l'opérateur de
	// vérifier son geste — c'est précisément ce que `id_materiel` existe pour couvrir.
	let emplacement: string | null = null;
	if (res.data.id_materiel && !res.data.positions_divergentes) {
		const materiel = await getEquipment(fetch, cookies);
		if (materiel.ok) {
			emplacement = materiel.data.find((e) => e.id === res.data.id_materiel)?.nom ?? null;
		}
	}

	return {
		resultat: { etat: 'trouvee', palette: res.data, emplacement } as ResultatPalette,
		saisie
	};
};
