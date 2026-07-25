export type NcStatus = 'en_cours' | 'quarantaine';

export type NcRow = {
	id: string;
	type: string;
	lot: string;
	statut: NcStatus;
};

export type QuarantineLot = {
	lot: string;
	detail: string;
};
