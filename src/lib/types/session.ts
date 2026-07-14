import type { KnownRole } from '$lib/config/roles';

export type SessionUser = {
	id: string;
	name: string;
	email: string;
	/** `undefined` = l'API ne l'expose pas encore ; `null` = aucun rôle. Cf. `$lib/config/roles`. */
	role: KnownRole;
};
