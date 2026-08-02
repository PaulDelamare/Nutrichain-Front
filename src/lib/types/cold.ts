export type ColdAlertStatus = 'critique' | 'investigation';

export type ColdAlertLot = {
	id: string;
	produit: string;
	/** Ce qui distingue deux lots du même produit. Replié sur l'identifiant abrégé si l'API se tait. */
	numeroLot: string;
	/** Faux si un contrôle qualité NON_CONFORME postérieur empêche la levée via cette alerte. */
	levable: boolean;
	/** Libellé français du motif quand `levable` est faux. */
	motifBlocage: string | null;
};

export type ColdAlertRow = {
	/** Référence courte affichée (pas l’UUID API). */
	id: string;
	/** UUID API — nécessaire pour PATCH /api/alerts/:id/resolve. */
	alertId: string;
	site: string;
	zone: string;
	tempActuelle: string;
	/** Seuil max du matériel (auparavant visible seulement dans le bandeau incident). */
	seuil: string;
	depuis: string;
	statut: ColdAlertStatus;
	lotsImpactes: ColdAlertLot[];
};
