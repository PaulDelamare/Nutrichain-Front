import type { LotStatus } from '$lib/types/lot';
import { lotStatusLabel } from '$lib/utils/lots/lotStatusLabel';

/**
 * Statuts de lot émis par l’API (`logistics.constants.ts` → `BATCH_STATUSES`).
 * Source unique pour graphes, badges et filtres — pas de littéraux recopiés écran par écran.
 */
export const BATCH_STATUSES = {
	EN_STOCK: 'EN_STOCK',
	EN_PRODUCTION: 'EN_PRODUCTION',
	EN_ATTENTE_QC: 'EN_ATTENTE_QC',
	BLOQUE: 'BLOQUE',
	ALERTE: 'ALERTE',
	EXPEDIE: 'EXPEDIE',
	EPUISE: 'EPUISE',
	REBUT: 'REBUT'
} as const;

export type ApiBatchStatus = (typeof BATCH_STATUSES)[keyof typeof BATCH_STATUSES];

export const BATCH_STATUS_COLORS: Record<string, string> = {
	[BATCH_STATUSES.EN_STOCK]: '#1b6b5c',
	[BATCH_STATUSES.EN_PRODUCTION]: '#8fd4c5',
	[BATCH_STATUSES.EN_ATTENTE_QC]: '#6366f1',
	[BATCH_STATUSES.BLOQUE]: '#ef4444',
	[BATCH_STATUSES.ALERTE]: '#f59e0b',
	[BATCH_STATUSES.EXPEDIE]: '#64748b',
	[BATCH_STATUSES.EPUISE]: '#94a3b8',
	[BATCH_STATUSES.REBUT]: '#7f1d1d',
	QUARANTAINE: '#ef4444',
	QUARANTINE: '#ef4444',
	SURVEILLANCE: '#f59e0b',
	PRET: '#1b6b5c',
	PERIME: '#94a3b8'
};

/**
 * Libellé humain d'un statut renvoyé par l'API.
 *
 * Il n'y a QU'UNE table de libellés dans le front, celle des badges de lot (`lotStatusLabel`) :
 * cette fonction n'est que le chemin qui y mène depuis un code API. Il y en avait deux — le
 * camembert du tableau de bord disait « Bloqué » là où la recherche disait « Quarantaine » pour le
 * même lot, et « En stock » là où elle disait « Conforme » (#81).
 */
export function batchStatusLabel(statut: string): string {
	const projete = toLotStatus(statut);

	// Un code que le front ne connaît pas encore : on le rend lisible plutôt que de le noyer sous
	// un « Inconnu » commun, qui donnerait deux parts de camembert portant la même légende.
	if (projete === 'inconnu') {
		const mots = statut.replace(/_/g, ' ').toLowerCase();
		return mots.charAt(0).toUpperCase() + mots.slice(1);
	}

	return lotStatusLabel(projete);
}

export function batchStatusColor(statut: string): string {
	return BATCH_STATUS_COLORS[statut] ?? '#94a3b8';
}

/** Projection UI (badges / fiche lot) depuis le statut API. */
export function toLotStatus(statut: string): LotStatus {
	const s = statut.toUpperCase();
	if (s === BATCH_STATUSES.EN_ATTENTE_QC) return 'attente_qc';
	if (s === BATCH_STATUSES.BLOQUE || s === 'QUARANTAINE' || s === 'QUARANTINE')
		return 'quarantaine';
	if (s === BATCH_STATUSES.ALERTE || s === 'SURVEILLANCE') return 'surveillance';
	if (s === BATCH_STATUSES.EN_PRODUCTION) return 'en_production';
	if (s === BATCH_STATUSES.EPUISE) return 'epuise';
	if (s === BATCH_STATUSES.REBUT) return 'rebut';
	if (s === 'PERIME') return 'perime';
	if (s === BATCH_STATUSES.EXPEDIE) return 'expedie';
	if (s === BATCH_STATUSES.EN_STOCK || s === 'PRET') return 'conforme';
	return 'inconnu';
}
