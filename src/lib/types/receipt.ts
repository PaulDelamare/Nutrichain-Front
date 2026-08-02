// Filtres de colonnes du listing des réceptions, dans l'ordre du tableau. `tous` est la sentinelle
// « pas de filtre » des selects (cf. receptionsSearchParams).

export type ReceiptFilters = {
	ref: string;
	fournisseur: string;
	statut: string;
	date: string;
};

export const emptyReceiptFilters = (): ReceiptFilters => ({
	ref: '',
	fournisseur: 'tous',
	statut: 'tous',
	date: ''
});
