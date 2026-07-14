// Miroir des constantes de l'API (src/modules/identity/constants/roles.constants.ts).
// L'interface EXPLIQUE les droits, elle ne les accorde pas : l'autorisation reste le 403 de l'API.
export const ROLES = ['owner', 'admin', 'quality', 'operator', 'viewer'] as const;

export type Role = (typeof ROLES)[number];

/** Écrire de la matière : réceptionner, transformer, expédier. */
export const WRITE_ROLES: Role[] = ['owner', 'admin', 'operator'];

/**
 * Décider de la qualité : lever une quarantaine, saisir un contrôle, déclencher un rappel,
 * clore une alerte. L'`operator` en est exclu — séparation des tâches HACCP : celui qui
 * réceptionne ou produit ne valide pas sa propre marchandise.
 */
export const QUALITY_ROLES: Role[] = ['owner', 'admin', 'quality'];

/** Administrer l'organisation, et lire les données personnelles (annuaire, audit, clients). */
export const ADMIN_ROLES: Role[] = ['owner', 'admin'];

/**
 * Le rôle tel que l'interface le connaît. Trois états, pas deux — la distinction est vitale :
 *
 * - `undefined` : l'API n'a PAS renvoyé le champ (version antérieure). On ne masque alors RIEN.
 *   Masquer serait pire que de ne rien faire : un `owner` se retrouverait privé de toutes ses
 *   actions par un simple décalage de déploiement. Le 403 de l'API reste l'autorité.
 * - `null` : l'API a répondu, et l'utilisateur n'a aucun rôle exploitable (pas d'organisation
 *   active, ou rôle hors référentiel). On masque.
 * - un `Role` : nominal.
 */
export type KnownRole = Role | null | undefined;

function autorise(role: KnownRole, permis: Role[]): boolean {
	if (role === undefined) return true; // API sans le champ : on n'ose pas masquer.
	if (role === null) return false;
	return permis.includes(role);
}

export function peutDeciderQualite(role: KnownRole): boolean {
	return autorise(role, QUALITY_ROLES);
}

export function peutAdministrer(role: KnownRole): boolean {
	return autorise(role, ADMIN_ROLES);
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
