// Filtres de colonnes du listing des produits (Configuration), filtrés côté API. `tous` est la
// sentinelle « pas de filtre » du select de statut.
export type ProductFilters = {
	nom: string;
	gtin: string;
	statut: string;
};

export const emptyProductFilters = (): ProductFilters => ({
	nom: '',
	gtin: '',
	statut: 'tous'
});
