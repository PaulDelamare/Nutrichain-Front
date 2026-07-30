import type { PageServerLoad } from './$types';
import { getLogisticUnitBySscc } from '$lib/Api/logistics.server';
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

	return { resultat: { etat: 'trouvee', palette: res.data } as ResultatPalette, saisie };
};
