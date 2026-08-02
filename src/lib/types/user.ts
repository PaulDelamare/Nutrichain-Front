export type AppUser = {
	memberId: string;
	userId: string;
	email: string;
	/** Libellé affiché (« Opérateur »). Pour agir sur le rôle, utiliser `rawRole`. */
	role: string;
	/** Rôle brut de l'API (`operator`…), clé des actions de changement de rôle. */
	rawRole: string;
	mfa: boolean;
};

// Filtres de colonnes du listing des utilisateurs, dans l'ordre du tableau. `tous` est la sentinelle
// « pas de filtre » des selects (cf. usersSearchParams). `mfa` est un tri-état d'affichage
// (tous/actif/inactif) que l'URL traduit ensuite en booléen d'API.
export type UserFilters = {
	email: string;
	role: string;
	mfa: string;
};

export const emptyUserFilters = (): UserFilters => ({
	email: '',
	role: 'tous',
	mfa: 'tous'
});
