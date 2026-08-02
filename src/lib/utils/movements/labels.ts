export const MOVEMENT_CHART_TYPES = [
	'RECEPTION',
	'EXPEDITION',
	'LIVRAISON',
	'QUARANTAINE',
	'TRANSFORMATION',
	'AUTRE'
] as const;

export type MovementChartType = (typeof MOVEMENT_CHART_TYPES)[number];

export function normalizeMovementType(type: string): MovementChartType {
	const t = type.toUpperCase();
	if (t.includes('RECEPTION')) return 'RECEPTION';
	if (t === 'EXPEDITION') return 'EXPEDITION';
	// Catégorie à part, et non repli sur « Autres » : une arrivée constatée porte sur de la
	// marchandise déjà comptée en expédition. Confondue avec elle, elle doublerait le flux sortant ;
	// noyée dans « Autres », elle gonflerait un fourre-tout sans que personne sache pourquoi.
	if (t === 'LIVRAISON') return 'LIVRAISON';
	if (t.includes('QUARANTAINE') || t.includes('QUARANT') || t === 'QUARANTAINE_FROID')
		return 'QUARANTAINE';
	if (
		t.startsWith('TRANSFORMATION') ||
		t === 'TRANSFORM_CONSUME' ||
		t === 'TRANSFORM_CREATE' ||
		t === 'TRANSFORMATION'
	)
		return 'TRANSFORMATION';
	return 'AUTRE';
}

export const MOVEMENT_CHART_LABELS: Record<MovementChartType, string> = {
	RECEPTION: 'Réceptions',
	EXPEDITION: 'Expéditions',
	LIVRAISON: 'Arrivées constatées',
	QUARANTAINE: 'Quarantaines',
	TRANSFORMATION: 'Transformations',
	AUTRE: 'Autres'
};

export const MOVEMENT_CHART_COLORS: Record<MovementChartType, string> = {
	RECEPTION: '#1b6b5c',
	EXPEDITION: '#5aafa0',
	LIVRAISON: '#0f766e',
	QUARANTAINE: '#f59e0b',
	TRANSFORMATION: '#8fd4c5',
	AUTRE: '#94a3b8'
};

/**
 * Libellés de l'historique INTERNE d'un lot (`Batch_Mouvement`).
 *
 * Aucun ne nomme un type d'événement EPCIS, et c'est le sujet de #83 : l'API n'a jamais émis de
 * `TransactionEvent`, et la quarantaine, le rappel, le contrôle qualité, le déplacement et le rebut
 * n'émettent rien du tout. Étiqueter un mouvement d'un type EPCIS transformait une lacune assumée
 * en affirmation fausse à l'écran. La vue normalisée, et la seule, c'est le journal EPCIS.
 *
 * Doit couvrir tout `MOVEMENT_TYPES` de l'API (`logistics.constants.ts`) : ce qui manque ici sort
 * tel quel dans l'activité récente du tableau de bord — « ObjectEvent — DEPLACEMENT » (#81).
 *
 * Le vocabulaire reprend celui de la frise de la fiche lot (`lots/lotEvents.ts`) — deux écrans qui
 * nomment le même geste autrement se contredisent. Une exception assumée : `LIVRAISON` se dit ici
 * « Arrivée constatée », comme la légende du graphe juste au-dessus, alors que la frise dit
 * « Livraison confirmée ». Sur un même écran, la cohérence prime sur l'alignement inter-écrans.
 */
export const MOVEMENT_LABELS: Record<string, string> = {
	RECEPTION: 'Réception',
	EXPEDITION: 'Expédition',
	QUARANTAINE_FROID: 'Quarantaine — excursion de température',
	TRANSFORMATION_ENTREE: 'Transformation — production',
	TRANSFORMATION_SORTIE: 'Transformation — consommation',
	CONTROLE_QUALITE: 'Contrôle qualité',
	LEVEE_QUARANTAINE: 'Levée de quarantaine',
	RAPPEL: 'Rappel produit',
	DEPLACEMENT: 'Déplacement',
	MISE_AU_REBUT: 'Mise au rebut',
	LIVRAISON: 'Arrivée constatée chez le client',
	RETRAIT_MAGASIN: 'Retrait du rayon'
};

/**
 * Repli pour un type que l'API ajouterait sans qu'on l'ait traduit ici : il montre le code brut
 * plutôt que d'inventer une catégorie, et le préfixe dit ce que la ligne est — un mouvement — sans
 * revendiquer un standard.
 */
export function movementLabel(type: string): string {
	return MOVEMENT_LABELS[type] ?? `Mouvement — ${type}`;
}
