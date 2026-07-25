import { fail, redirect } from '@sveltejs/kit';
import { verifyTwoFactorTotp } from '$lib/Api/auth.server';
import type { Actions } from './$types';

export const actions = {
	default: async ({ request, fetch, cookies, url }) => {
		const form = await request.formData();
		const code = String(form.get('code') ?? '').trim();

		if (!code) {
			return fail(400, { error: 'Code requis.' });
		}

		const res = await verifyTwoFactorTotp(fetch, cookies, code);

		if (!res.ok) {
			return fail(res.status, { error: res.message });
		}

		const target = url.searchParams.get('redirect') || '/tableau-de-bord';
		redirect(303, target);
	}
} satisfies Actions;
