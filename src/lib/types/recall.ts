export type RecallStatus = 'en_cours' | 'cloture';

export type Recall = {
	id: string;
	produit: string;
	statut: RecallStatus;
	lots: string;
	sites: string;
	etape: string;
	etapeTitre: string;
	etapeDetail: string;
};

// Filtres de colonnes du listing des rappels. `tous` est la sentinelle « pas de filtre » du select
// de statut ; les autres valeurs (`en_cours`/`cloture`) partent telles quelles à l'API.
export type RecallFilters = {
	q: string;
	statut: string;
};

export const emptyRecallFilters = (): RecallFilters => ({
	q: '',
	statut: 'tous'
});
