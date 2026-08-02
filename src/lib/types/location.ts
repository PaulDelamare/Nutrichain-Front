// Filtres du listing des emplacements (Configuration), dans l'ordre du tableau. `tous` est la
// sentinelle « pas de filtre » des selects.

export type LocationFilters = {
	nom: string;
	type: string;
	statut: string;
};

export const emptyLocationFilters = (): LocationFilters => ({
	nom: '',
	type: 'tous',
	statut: 'tous'
});
