export type ColdAlertStatus = 'critique' | 'investigation';

export type ColdAlertLot = { id: string; produit: string };

export type ColdAlertRow = {
	id: string;
	site: string;
	zone: string;
	// Température ACTUELLE du capteur — pas le pic. Le pic figure dans le message de l'incident.
	tempActuelle: string;
	depuis: string;
	statut: ColdAlertStatus;
	// Lots en quarantaine sur l'équipement en excursion : le lien « je vois → je comprends ».
	lotsImpactes: ColdAlertLot[];
};

export type ColdIncident = {
	id: string;
	message: string;
};
