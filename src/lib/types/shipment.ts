// Filtres de colonnes du listing des expéditions, dans l'ordre du tableau. `tous` est la sentinelle
// « pas de filtre » des selects (cf. shipmentsSearchParams).

export type ShipmentFilters = {
	ref: string;
	client: string;
	statut: string;
	date: string;
};

export const emptyShipmentFilters = (): ShipmentFilters => ({
	ref: '',
	client: 'tous',
	statut: 'tous',
	date: ''
});
