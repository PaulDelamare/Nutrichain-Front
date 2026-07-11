export type LotStatus = 'conforme' | 'surveillance' | 'quarantaine';

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
	sscc: string;
	site: string;
	statut: string;
};

export const emptyLotFilters = (): LotFilters => ({
	gtin: '',
	lot: '',
	sscc: '',
	site: 'tous',
	statut: 'tous'
});
