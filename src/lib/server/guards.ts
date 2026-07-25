import { error } from '@sveltejs/kit';
import { peutAdministrer, peutDeciderQualite } from '$lib/config/roles';
import type { SessionUser } from '$lib/types/session';

export function exigerAdministrateur(user: SessionUser | undefined, quoi: string): void {
	if (user && peutAdministrer(user.role)) return;

	error(403, `${quoi} est réservé aux administrateurs de l'organisation.`);
}

const MESSAGE_QUALITE =
	'Cette décision qualité est réservée aux rôles qualité, administrateur et propriétaire.';

const MESSAGE_ADMIN = "Cette action est réservée aux administrateurs de l'organisation.";

export function refusDecisionQualite(user: SessionUser | undefined): string | null {
	return user && peutDeciderQualite(user.role) ? null : MESSAGE_QUALITE;
}

export function refusAdministration(user: SessionUser | undefined): string | null {
	return user && peutAdministrer(user.role) ? null : MESSAGE_ADMIN;
}

export function exigerAdminPlateforme(user: SessionUser | undefined): void {
	if (user?.isPlatformAdmin) return;

	error(403, 'Action réservée aux administrateurs de la plateforme.');
}
