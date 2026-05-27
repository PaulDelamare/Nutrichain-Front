export type ColdAlertStatus = 'critique' | 'investigation';

export type ColdAlertRow = {
	id: string;
	site: string;
	zone: string;
	tempMax: string;
	depuis: string;
	statut: ColdAlertStatus;
};

export type ColdIncident = {
	id: string;
	message: string;
};
