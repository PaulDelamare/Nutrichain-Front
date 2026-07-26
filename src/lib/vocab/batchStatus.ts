import type { LotStatus } from '$lib/types/lot';

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

/** Libellés du donut « répartition des lots » (codes API bruts). */
export const BATCH_STATUS_LABELS: Record<string, string> = {
	[BATCH_STATUSES.EN_STOCK]: 'En stock',
	[BATCH_STATUSES.EN_PRODUCTION]: 'En production',
	[BATCH_STATUSES.EN_ATTENTE_QC]: 'En attente de contrôle',
	[BATCH_STATUSES.BLOQUE]: 'Bloqué',
	[BATCH_STATUSES.ALERTE]: 'Sous rappel',
	[BATCH_STATUSES.EXPEDIE]: 'Expédié',
	[BATCH_STATUSES.EPUISE]: 'Épuisé',
	[BATCH_STATUSES.REBUT]: 'Mis au rebut',
	// Alias historiques encore rencontrés en démo / anciennes données
	QUARANTAINE: 'Bloqué',
	QUARANTINE: 'Bloqué',
	SURVEILLANCE: 'Sous rappel',
	PRET: 'En stock',
	PERIME: 'Périmé'
};

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

export function batchStatusLabel(statut: string): string {
	return BATCH_STATUS_LABELS[statut] ?? statut.replace(/_/g, ' ').toLowerCase();
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
