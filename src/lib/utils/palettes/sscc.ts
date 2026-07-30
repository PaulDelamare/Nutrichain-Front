/**
 * Le SSCC tel qu'il arrive : d'une douchette, d'un copier-coller, ou de l'étiquette elle-même.
 *
 * L'étiquette encode l'element string GS1 complet — l'AI `00` suivi des 18 chiffres — et une
 * saisie humaine ajoute volontiers espaces et tirets. La route de l'API attend les 18 chiffres
 * seuls : sans ce nettoyage, une lecture parfaitement valide repartait en 400.
 *
 * @returns les 18 chiffres, ou `null` si ce n'est pas un SSCC.
 */
export function normaliserSscc(brut: string): string | null {
	const chiffres = brut.replace(/[\s-]/g, '');

	if (/^\d{18}$/.test(chiffres)) return chiffres;
	if (/^00\d{18}$/.test(chiffres)) return chiffres.slice(2);

	return null;
}
