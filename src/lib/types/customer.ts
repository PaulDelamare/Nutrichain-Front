// Filtres de colonnes du listing des clients (Configuration), filtrés côté API. `tous` est la
// sentinelle « pas de filtre » du select de statut.
export type CustomerFilters = {
	nom: string;
	statut: string;
};

export const emptyCustomerFilters = (): CustomerFilters => ({
	nom: '',
	statut: 'tous'
});
