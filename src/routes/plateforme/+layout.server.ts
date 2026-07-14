import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		redirect(303, `/connexion?redirect=${encodeURIComponent(url.pathname)}`);
	}

	if (!locals.user.isPlatformAdmin) {
		redirect(303, '/tableau-de-bord');
	}

	return { user: locals.user };
};
