// Filtres de colonnes du listing des emplacements (Configuration), filtrés côté API. `tous` est la
// sentinelle « pas de filtre » du select de statut.
export type LocationFilters = {
	nom: string;
	statut: string;
};

export const emptyLocationFilters = (): LocationFilters => ({
	nom: '',
	statut: 'tous'
});
