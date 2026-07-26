export type ColdAlertStatus = 'critique' | 'investigation';

export type ColdAlertLot = { id: string; produit: string };

export type ColdAlertRow = {
	/** Référence courte affichée (pas l’UUID API). */
	id: string;
	/** UUID API — nécessaire pour PATCH /api/alerts/:id/resolve. */
	alertId: string;
	site: string;
	zone: string;
	tempActuelle: string;
	depuis: string;
	statut: ColdAlertStatus;
	lotsImpactes: ColdAlertLot[];
};

export type ColdIncident = {
	id: string;
	message: string;
};
