import { fail, redirect } from '@sveltejs/kit';
import { verifyTwoFactorTotp } from '$lib/Api/auth.server';
import { safeRedirect } from '$lib/utils/safeRedirect';
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

		// Assaini comme sur la page de connexion (#77). Sans ça, `/connexion/2fa?redirect=https://…`
		// envoyait l'utilisateur sur un site tiers JUSTE APRÈS la validation de son second facteur —
		// le moment où il a le plus de raisons de croire qu'il est bien sur NutriChain, donc celui
		// où une page clone qui redemande un mot de passe est la plus crédible.
		const target = safeRedirect(url.searchParams.get('redirect'), '/tableau-de-bord');
		redirect(303, target);
	}
} satisfies Actions;
