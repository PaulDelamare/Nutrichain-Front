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
	| { etat: 'trouvee'; palette: ApiLogisticUnit }
	| { etat: 'erreur'; saisie: string; message: string };

export type DonneesPalettes = { resultat: ResultatPalette; saisie: string };
