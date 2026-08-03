// Filtres de colonnes du listing des fournisseurs (Configuration), filtrés côté API. `tous` est la
// sentinelle « pas de filtre » du select de statut.
export type SupplierFilters = {
	nom: string;
	statut: string;
};

export const emptySupplierFilters = (): SupplierFilters => ({
	nom: '',
	statut: 'tous'
});
