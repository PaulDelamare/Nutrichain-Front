import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	getSuppliers,
	getLocations,
	createSupplier,
	setSupplierActive,
	createLocation,
	setLocationActive
} from '$lib/Api/organization.server';
import { exigerAdministrateur, refusAdministration } from '$lib/server/guards';

export const load: PageServerLoad = async ({ fetch, cookies, locals }) => {
	// La configuration de l'usine est réservée aux administrateurs. Le garde de layout ne suffit pas
	// (il ne couvre pas les actions) : on garde aussi ce load.
	exigerAdministrateur(locals.user, "La configuration de l'usine");

	// includeArchived : l'écran d'administration montre TOUT, y compris les archivés, pour réactiver.
	const [suppliers, locations] = await Promise.all([
		getSuppliers(fetch, cookies, true),
		getLocations(fetch, cookies, true)
	]);

	return {
		suppliers: suppliers.ok ? suppliers.data : [],
		locations: locations.ok ? locations.data : [],
		error: suppliers.ok && locations.ok ? undefined : suppliers.message || locations.message
	};
};

const champ = (form: FormData, nom: string) => String(form.get(nom) ?? '').trim();

export const actions = {
	createSupplier: async ({ request, fetch, cookies, locals }) => {
		const form = await request.formData();
		const nom_ferme = champ(form, 'nom_ferme');
		const adresse_siege = champ(form, 'adresse_siege');
		const type_produit = champ(form, 'type_produit');

		// Dans une ACTION on renvoie un fail() (l'error() de exigerAdministrateur navigue en pleine
		// page et jette la saisie) : aligné sur /utilisateurs et /audit-logs.
		const refus = refusAdministration(locals.user);
		if (refus) return fail(403, { supplierError: refus, nom_ferme });

		if (nom_ferme.length < 2 || adresse_siege.length < 2) {
			return fail(400, { supplierError: 'Nom et adresse du fournisseur requis.', nom_ferme });
		}

		const res = await createSupplier(fetch, cookies, {
			nom_ferme,
			adresse_siege,
			...(type_produit ? { type_produit } : {})
		});
		if (!res.ok) return fail(res.status, { supplierError: res.message, nom_ferme });

		return { supplierCreated: res.data };
	},

	toggleSupplier: async ({ request, fetch, cookies, locals }) => {
		const refus = refusAdministration(locals.user);
		if (refus) return fail(403, { supplierError: refus });

		const form = await request.formData();
		const id = champ(form, 'id');
		const active = champ(form, 'active') === 'true';

		const res = await setSupplierActive(fetch, cookies, id, active);
		if (!res.ok) return fail(res.status, { supplierError: res.message });

		return { supplierToggled: res.data };
	},

	createLocation: async ({ request, fetch, cookies, locals }) => {
		const form = await request.formData();
		const nom = champ(form, 'nom');
		const type = champ(form, 'type');
		const description = champ(form, 'description');

		const refus = refusAdministration(locals.user);
		if (refus) return fail(403, { locationError: refus, nom });

		if (nom.length < 2 || type.length < 2) {
			return fail(400, { locationError: "Nom et type de l'emplacement requis.", nom });
		}

		const res = await createLocation(fetch, cookies, {
			nom,
			type,
			...(description ? { description } : {})
		});
		if (!res.ok) return fail(res.status, { locationError: res.message, nom });

		return { locationCreated: res.data };
	},

	toggleLocation: async ({ request, fetch, cookies, locals }) => {
		const refus = refusAdministration(locals.user);
		if (refus) return fail(403, { locationError: refus });

		const form = await request.formData();
		const id = champ(form, 'id');
		const active = champ(form, 'active') === 'true';

		const res = await setLocationActive(fetch, cookies, id, active);
		if (!res.ok) return fail(res.status, { locationError: res.message });

		return { locationToggled: res.data };
	}
} satisfies Actions;
