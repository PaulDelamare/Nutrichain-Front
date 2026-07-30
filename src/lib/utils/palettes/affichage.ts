import { batchStatusColor, batchStatusLabel } from '$lib/vocab/batchStatus';

/**
 * Le badge d'un lot posé sur une palette : le libellé et la couleur viennent de la source UNIQUE
 * du front (`$lib/vocab/batchStatus`).
 *
 * Ne pas recréer de table ici. Il y en avait deux — le camembert du tableau de bord disait
 * « Bloqué » là où la recherche disait « Quarantaine » pour le même lot (#81) —, et une table
 * locale laisserait de surcroît un lot au rebut ou périmé s'afficher sous son code technique,
 * visuellement indistinct d'un statut anodin.
 */
export function badgeLot(statut: string): { label: string; couleur: string } {
	return { label: batchStatusLabel(statut), couleur: batchStatusColor(statut) };
}

/** 18 chiffres se comparent mal à l'œil : on les groupe pour relire l'étiquette collée dessus. */
export function grouperSscc(sscc: string): string {
	return sscc.replace(/(\d{4})(?=\d)/g, '$1 ');
}
