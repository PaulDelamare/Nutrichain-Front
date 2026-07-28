import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { signUp } from '$lib/Api/auth.server';
import { inviteRoleLabel } from '$lib/config/invite-roles';
import { getInvitationPreview } from '$lib/Api/identity.server';

/** Le jeton d'invitation EST l'id d'invitation, donc un UUID — même message qu'un jeton inconnu. */
const EST_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const load: PageServerLoad = async ({ fetch, url, locals }) => {
	if (locals.user) {
		redirect(303, '/tableau-de-bord');
	}

	const token = url.searchParams.get('token');
	if (!token) {
		return { invitation: null as null, token: null as null };
	}

	// Défense en profondeur (#78). L'encodage côté client d'API suffit à empêcher la traversée de
	// chemin ; valider la FORME évite en plus qu'une valeur arbitraire parte vers l'API, depuis une
	// page accessible sans authentification. Le jeton est l'id d'invitation : un UUID, rien d'autre.
	if (!EST_UUID.test(token)) {
		error(404, { message: 'Invitation invalide ou expirée.' });
	}

	const preview = await getInvitationPreview(fetch, token);
	if (!preview.ok) {
		error(404, { message: preview.message || 'Invitation invalide ou expirée.' });
	}

	return {
		token,
		invitation: {
			email: preview.data.email,
			role: inviteRoleLabel(preview.data.role),
			expiresAt: new Date(preview.data.expiresAt).toLocaleDateString('fr-FR')
		}
	};
};

export const actions = {
	default: async ({ request, fetch, cookies }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const email = String(form.get('email') ?? '').trim();
		const password = String(form.get('password') ?? '');
		const token = String(form.get('token') ?? '');

		if (!name || !email || !password) {
			return fail(400, { error: 'Nom, e-mail et mot de passe requis.', name, email, token });
		}

		const res = await signUp(fetch, cookies, name, email, password, token);

		if (!res.ok) {
			return fail(res.status === 429 ? 429 : res.status, {
				error: res.message,
				name,
				email,
				token
			});
		}

		redirect(303, '/tableau-de-bord');
	}
} satisfies Actions;
