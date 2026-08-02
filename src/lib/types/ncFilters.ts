// Filtres par colonne des trois listings de la page Non-conformités. Chaque champ suit l'ordre des
// colonnes du tableau ; `tous` est la sentinelle « pas de filtre » des selects (cf. matchOption).

export type PendingQcFilters = {
	lot: string;
	produit: string;
	quantite: string;
	depuis: string;
};

export const emptyPendingQcFilters = (): PendingQcFilters => ({
	lot: '',
	produit: 'tous',
	quantite: '',
	depuis: ''
});

export type NcOpenFilters = {
	id: string;
	type: string;
	lot: string;
	statut: string;
};

export const emptyNcOpenFilters = (): NcOpenFilters => ({
	id: '',
	type: 'tous',
	lot: '',
	statut: 'tous'
});

export type QuarantineFilters = {
	numero: string;
	detail: string;
};

export const emptyQuarantineFilters = (): QuarantineFilters => ({
	numero: '',
	detail: ''
});
