export type LotStatus =
	| 'conforme'
	| 'surveillance'
	| 'quarantaine'
	| 'perime'
	| 'expedie'
	| 'inconnu';

export type LotRow = {
	id: string;
	lotNumber?: string;
	produit: string;
	gtin: string;
	sscc: string;
	site: string;
	statut: LotStatus;
	temperature: string;
};

export type LotFilters = {
	gtin: string;
	lot: string;
	produit: string;
	site: string;
	statut: string;
};

export const emptyLotFilters = (): LotFilters => ({
	gtin: '',
	lot: '',
	produit: 'tous',
	site: 'tous',
	statut: 'tous'
});
