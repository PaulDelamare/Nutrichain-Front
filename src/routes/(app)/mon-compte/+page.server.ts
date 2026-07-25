import { fail } from '@sveltejs/kit';
import { enableTwoFactor, verifyTwoFactorTotp, disableTwoFactor } from '$lib/Api/auth.server';
import type { Actions, PageServerLoad } from './$types';

// `locals.user` porte déjà `twoFactorEnabled` (résolu une fois par requête dans hooks.server.ts) :
// un second appel à /api/me ici serait redondant.
export const load: PageServerLoad = async ({ locals }) => {
	return { twoFactorEnabled: Boolean(locals.user?.twoFactorEnabled) };
};

export const actions = {
	/** Démarre l'enrôlement : renvoie le QR code et les codes de secours à afficher UNE fois. */
	enable: async ({ request, fetch, cookies }) => {
		const form = await request.formData();
		const password = String(form.get('password') ?? '');

		if (!password) {
			return fail(400, { error: 'Mot de passe requis.' });
		}

		const res = await enableTwoFactor(fetch, cookies, password);

		if (!res.ok || !res.payload) {
			return fail(res.status, { error: res.message });
		}

		return { totpURI: res.payload.totpURI, backupCodes: res.payload.backupCodes };
	},

	/** Confirme l'enrôlement avec le code lu dans l'application d'authentification. */
	confirm: async ({ request, fetch, cookies }) => {
		const form = await request.formData();
		const code = String(form.get('code') ?? '').trim();

		if (!code) {
			return fail(400, { error: 'Code requis.' });
		}

		const res = await verifyTwoFactorTotp(fetch, cookies, code);

		if (!res.ok) {
			return fail(res.status, { error: res.message });
		}

		return { confirmed: true };
	},

	/** Désactive la 2FA — redemande le mot de passe, comme l'enrôlement. */
	disable: async ({ request, fetch, cookies }) => {
		const form = await request.formData();
		const password = String(form.get('password') ?? '');

		if (!password) {
			return fail(400, { error: 'Mot de passe requis.' });
		}

		const res = await disableTwoFactor(fetch, cookies, password);

		if (!res.ok) {
			return fail(res.status, { error: res.message });
		}

		return { disabled: true };
	}
} satisfies Actions;
