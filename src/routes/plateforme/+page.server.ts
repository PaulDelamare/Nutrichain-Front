import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	getOrganizations,
	createOrganization,
	inviteOrganizationOwner
} from '$lib/Api/platform.server';
import { exigerAdminPlateforme } from '$lib/server/guards';

export const load: PageServerLoad = async ({ fetch, cookies, locals }) => {
	// Le layout garde déjà l'accès, mais le load d'une page est indépendant : on ne charge pas la
	// liste des organisations pour quelqu'un qui n'y a pas droit.
	exigerAdminPlateforme(locals.user);

	const orgs = await getOrganizations(fetch, cookies);

	if (!orgs.ok) {
		return { organizations: [], error: orgs.message };
	}

	return { organizations: orgs.data };
};

// Slug lisible : minuscules, chiffres, tirets — aligné sur la validation de l'API.
function slugify(source: string): string {
	return source
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

export const actions = {
	create: async ({ request, fetch, cookies, locals }) => {
		exigerAdminPlateforme(locals.user);

		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const slug = slugify(String(form.get('slug') ?? '') || name);
		const gs1 = String(form.get('gs1_company_prefix') ?? '').trim();

		if (name.length < 2) {
			return fail(400, { createError: "Le nom de l'organisation est requis.", name });
		}

		// Le slug est dérivé du nom : un nom d'emoji/ponctuation seule donnerait un slug vide, que
		// l'API rejette avec un message technique. On l'explique ici, avant l'appel.
		if (slug.length < 2) {
			return fail(400, {
				createError:
					"L'identifiant court n'a pas pu être déduit du nom : ajoutez des lettres ou saisissez-le à la main.",
				name
			});
		}

		const res = await createOrganization(fetch, cookies, {
			name,
			slug,
			...(gs1 ? { gs1_company_prefix: gs1 } : {})
		});

		if (!res.ok) {
			return fail(res.status, { createError: res.message, name });
		}

		return { created: res.data };
	},

	inviteOwner: async ({ request, fetch, cookies, locals }) => {
		exigerAdminPlateforme(locals.user);

		const form = await request.formData();
		const organizationId = String(form.get('organizationId') ?? '');
		const email = String(form.get('email') ?? '').trim();

		if (!organizationId || !email) {
			return fail(400, { inviteError: 'Organisation et e-mail requis.', organizationId });
		}

		const res = await inviteOrganizationOwner(fetch, cookies, organizationId, email);

		if (!res.ok) {
			return fail(res.status, { inviteError: res.message, organizationId });
		}

		return { invited: { organizationId, email } };
	}
} satisfies Actions;
