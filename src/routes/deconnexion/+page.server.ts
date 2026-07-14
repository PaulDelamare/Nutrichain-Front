import { redirect } from '@sveltejs/kit';
import { signOut } from '$lib/Api/auth.server';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ fetch, cookies }) => {
		await signOut(fetch, cookies);
		redirect(303, '/connexion');
	}
};
