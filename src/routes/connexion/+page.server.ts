import { fail, redirect } from '@sveltejs/kit';
import { signIn } from '$lib/Api/auth.server';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) {
		// L'admin de plateforme n'a pas d'espace métier : sa console est sa page d'accueil.
		const defaut = locals.user.isPlatformAdmin ? '/plateforme' : '/tableau-de-bord';
		redirect(303, url.searchParams.get('redirect') || defaut);
	}
};

export const actions = {
	default: async ({ request, fetch, cookies, url }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim();
		const password = String(form.get('password') ?? '');

		if (!email || !password) {
			return fail(400, { error: 'Email et mot de passe requis.', email });
		}

		const res = await signIn(fetch, cookies, email, password);

		if (!res.ok) {
			const message =
				res.status === 429
					? 'Trop de requêtes vers l’API. Attendez une minute puis réessayez.'
					: res.message;
			return fail(res.status === 429 ? 429 : res.status, { error: message, email });
		}

		const target = url.searchParams.get('redirect') || '/tableau-de-bord';
		redirect(303, target);
	}
} satisfies Actions;
