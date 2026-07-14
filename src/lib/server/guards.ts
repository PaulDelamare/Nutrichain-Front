import { error } from '@sveltejs/kit';
import { peutAdministrer, peutDeciderQualite } from '$lib/config/roles';
import type { SessionUser } from '$lib/types/session';

/**
 * Refuse l'accès à une PAGE dont l'API refuserait de toute façon la donnée.
 *
 * Sans ce garde, masquer le lien ne suffit pas : l'URL reste atteignable, le chargeur récupère un
 * 403 et la page s'affiche vide avec une erreur brute — exactement le « bandeau rouge
 * indistinguable d'une panne » qu'on cherche à supprimer. Ici, l'utilisateur lit POURQUOI.
 *
 * Réservé aux `load`. Dans une action, `error()` navigue en pleine page et JETTE la saisie :
 * utiliser `refusDecisionQualite` / `refusAdministration`, qui rendent un `fail()`.
 */
export function exigerAdministrateur(user: SessionUser | undefined, quoi: string): void {
	// Une session ABSENTE n'est pas « une API sans le champ » : le fail-open ne s'applique qu'au
	// rôle inconnu d'un utilisateur connu. Sans ce test, `user?.role` valait `undefined` et laissait
	// passer un visiteur sans session.
	if (user && peutAdministrer(user.role)) return;

	error(403, `${quoi} est réservé aux administrateurs de l'organisation.`);
}

const MESSAGE_QUALITE =
	'Cette décision qualité est réservée aux rôles qualité, administrateur et propriétaire.';

const MESSAGE_ADMIN = "Cette action est réservée aux administrateurs de l'organisation.";

/**
 * Refuse une décision qualité (levée de quarantaine, contrôle, rappel) dans une ACTION.
 *
 * Renvoie le message à placer dans le retour `fail()` de l'action, ou `null` si le rôle est
 * habilité. On ne lève pas `error()` : les formulaires ne sont pas interceptés par `use:enhance`,
 * donc une erreur ferait une navigation pleine page et perdrait le motif déjà saisi — alors que
 * chaque page a déjà un emplacement d'erreur en ligne.
 *
 * L'autorisation RÉELLE reste le 403 de l'API : ce garde évite d'envoyer une décision sanitaire
 * dont on sait déjà qu'elle sera refusée, et il l'explique.
 */
export function refusDecisionQualite(user: SessionUser | undefined): string | null {
	return user && peutDeciderQualite(user.role) ? null : MESSAGE_QUALITE;
}

export function refusAdministration(user: SessionUser | undefined): string | null {
	return user && peutAdministrer(user.role) ? null : MESSAGE_ADMIN;
}

/**
 * Réserve une PAGE ou une ACTION de la console plateforme au personnel NutriChain.
 *
 * Indispensable dans les ACTIONS, pas seulement le `load` : en SvelteKit, le `load` d'un
 * `+layout.server.ts` ne s'exécute PAS avant l'action d'une page enfant. Le garde de layout protège
 * donc la lecture, mais un non-admin pourrait POSTer `?/create` directement sans ce contrôle.
 */
export function exigerAdminPlateforme(user: SessionUser | undefined): void {
	if (user?.isPlatformAdmin) return;

	error(403, 'Action réservée aux administrateurs de la plateforme.');
}
