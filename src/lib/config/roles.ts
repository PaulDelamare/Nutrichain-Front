export const ROLES = ['owner', 'admin', 'quality', 'operator', 'viewer'] as const;

export type Role = (typeof ROLES)[number];

export const WRITE_ROLES: Role[] = ['owner', 'admin', 'operator'];

export const QUALITY_ROLES: Role[] = ['owner', 'admin', 'quality'];

export const ADMIN_ROLES: Role[] = ['owner', 'admin'];

export type KnownRole = Role | null | undefined;

function autorise(role: KnownRole, permis: Role[]): boolean {
	if (role === undefined) return true;
	if (role === null) return false;
	return permis.includes(role);
}

export function peutDeciderQualite(role: KnownRole): boolean {
	return autorise(role, QUALITY_ROLES);
}

export function peutAdministrer(role: KnownRole): boolean {
	return autorise(role, ADMIN_ROLES);
}

/**
 * Miroir de la garde API du retrait en magasin : declarer un retrait est un FAIT rapporte par un
 * magasin, pas une decision qualite. L operateur qui prend l appel doit pouvoir l enregistrer, et
 * le role qualite conduit le rappel — seul le role en lecture seule en est ecarte.
 */
export const SHELF_WITHDRAWAL_ROLES: Role[] = ['owner', 'admin', 'quality', 'operator'];

export function canRecordShelfWithdrawal(role: KnownRole): boolean {
	return autorise(role, SHELF_WITHDRAWAL_ROLES);
}

export function peutEcrire(role: KnownRole): boolean {
	return autorise(role, WRITE_ROLES);
}

const LIBELLES: Record<Role, string> = {
	owner: 'Propriétaire',
	admin: 'Administrateur',
	quality: 'Qualité',
	operator: 'Opérateur',
	viewer: 'Lecteur'
};

export function roleLabel(role: KnownRole): string {
	return role ? (LIBELLES[role] ?? role) : 'Membre';
}

export function estRole(valeur: unknown): valeur is Role {
	return typeof valeur === 'string' && (ROLES as readonly string[]).includes(valeur);
}
