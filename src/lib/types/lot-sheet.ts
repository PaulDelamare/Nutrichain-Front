import type { LotStatus } from '$lib/types/lot';
import type { LotMapPin } from '$lib/types/lot-map';

/**
 * Nature d'une étape, qui détermine sa couleur dans la frise.
 *
 * ⚠️ Métier : la quarantaine BLOQUE le lot mais reste levable (orange) ; le rappel est une
 * décision IRRÉVERSIBLE (rouge). Les deux ne doivent jamais se confondre visuellement.
 */
export type LotEventTone = 'ok' | 'neutral' | 'warn' | 'danger';

export type LotEvent = {
	time: string;
	day?: string;
	title: string;
	detail: string;
	tone: LotEventTone;
};

export type LotSheet = {
	id: string;
	produit: string;
	gtin: string;
	dlc: string;
	quantite: string;
	statut: LotStatus;
	statutRaw: string;
	temperature: string;
	createdBy: string;
	events: LotEvent[];
	site: string;
	zone: string;
	wmsSync: string;
	/** Position carte — alimentée par site ou GPS futur */
	mapPin: LotMapPin | null;
};
