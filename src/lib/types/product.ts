// Filtres de colonnes du listing des produits (Configuration), filtrés côté API. `tous` est la
// sentinelle « pas de filtre » du select de statut.
export type ProductFilters = {
	nom: string;
	statut: string;
};

export const emptyProductFilters = (): ProductFilters => ({
	nom: '',
	statut: 'tous'
});
