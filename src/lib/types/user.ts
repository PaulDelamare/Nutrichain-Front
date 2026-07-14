export type AppUser = {
	memberId: string;
	userId: string;
	email: string;
	/** Libellé affiché (« Opérateur »). Pour agir sur le rôle, utiliser `rawRole`. */
	role: string;
	/** Rôle brut de l'API (`operator`…), clé des actions de changement de rôle. */
	rawRole: string;
	lastLogin: string;
	mfa: boolean;
};
