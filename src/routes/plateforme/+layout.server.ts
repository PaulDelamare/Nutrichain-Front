import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

/**
 * La console de plateforme est réservée au personnel NutriChain. Un membre d'organisation n'y a
 * rien à faire : il est renvoyé vers son espace métier. Symétrique de la redirection de l'espace
 * `(app)`, qui renvoie l'admin de plateforme ici.
 */
export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		redirect(303, `/connexion?redirect=${encodeURIComponent(url.pathname)}`);
	}

	if (!locals.user.isPlatformAdmin) {
		redirect(303, '/tableau-de-bord');
	}

	return { user: locals.user };
};
