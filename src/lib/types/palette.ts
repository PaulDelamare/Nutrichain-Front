import type { ApiLogisticUnit } from '$lib/Api/logistics.server';

/**
 * Les quatre issues d'une recherche de palette.
 *
 * `erreur` est distinct de `trouvee` avec zéro lot : rendre une palette vide sur une panne la
 * ferait passer pour une palette qui ne porte plus rien, et elle serait traitée comme telle.
 */
export type ResultatPalette =
	| { etat: 'vide' }
	| { etat: 'invalide'; saisie: string }
	| {
			etat: 'trouvee';
			palette: ApiLogisticUnit;
			/** Nom de l'emplacement où la palette est rangée. `null` si elle ne l'est pas, ou si le
			 * matériel n'a pas pu être résolu — mieux vaut ne rien dire que nommer le mauvais frigo. */
			emplacement: string | null;
	  }
	| { etat: 'erreur'; saisie: string; message: string };

export type DonneesPalettes = { resultat: ResultatPalette; saisie: string };
