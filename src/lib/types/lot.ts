export type LotStatus =
	| 'conforme'
	| 'attente_qc'
	| 'surveillance'
	| 'quarantaine'
	| 'en_production'
	| 'epuise'
	| 'rebut'
	| 'perime'
	| 'expedie'
	| 'inconnu';

export type LotRow = {
	id: string;
	lotNumber?: string;
	produit: string;
	gtin: string;
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
