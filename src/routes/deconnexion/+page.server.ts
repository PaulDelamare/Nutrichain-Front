import { redirect } from '@sveltejs/kit';
import { signOut } from '$lib/Api/auth.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	await signOut(fetch, cookies);
	redirect(303, '/connexion');
};
