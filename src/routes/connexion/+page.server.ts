import { fail, redirect } from '@sveltejs/kit';
import { signIn } from '$lib/Api/auth.server';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) {
		const target = url.searchParams.get('redirect') || '/tableau-de-bord';
		redirect(303, target);
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
			return fail(res.status, { error: res.message, email });
		}

		const target = url.searchParams.get('redirect') || '/tableau-de-bord';
		redirect(303, target);
	}
} satisfies Actions;
