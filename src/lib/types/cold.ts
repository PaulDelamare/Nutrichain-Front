export type ColdAlertStatus = 'critique' | 'investigation';

export type ColdAlertLot = { id: string; produit: string };

export type ColdAlertRow = {
	id: string;
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
