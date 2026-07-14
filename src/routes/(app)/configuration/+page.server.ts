import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	getSuppliers,
	getLocations,
	getCustomers,
	getProductsForConfig,
	createSupplier,
	setSupplierActive,
	createLocation,
	setLocationActive,
	createCustomer,
	setCustomerActive,
	createProduct,
	setProductActive
} from '$lib/Api/organization.server';
import { exigerAdministrateur, refusAdministration } from '$lib/server/guards';

export const load: PageServerLoad = async ({ fetch, cookies, locals }) => {
	// Le garde de layout ne couvre pas les actions : on garde aussi ce load.
	exigerAdministrateur(locals.user, "La configuration de l'usine");

	// includeArchived : l'écran d'administration montre TOUT, y compris les archivés, pour réactiver.
	const [suppliers, locations, customers, products] = await Promise.all([
		getSuppliers(fetch, cookies, true),
		getLocations(fetch, cookies, true),
		getCustomers(fetch, cookies, true),
		getProductsForConfig(fetch, cookies, true)
	]);

	const first = [suppliers, locations, customers, products].find((r) => !r.ok);

	return {
		suppliers: suppliers.ok ? suppliers.data : [],
		locations: locations.ok ? locations.data : [],
		customers: customers.ok ? customers.data : [],
		products: products.ok ? products.data : [],
		error: first && !first.ok ? first.message : undefined
	};
};

const champ = (form: FormData, nom: string) => String(form.get(nom) ?? '').trim();
const nombre = (form: FormData, nom: string) => Number(form.get(nom));

export const actions = {
	createSupplier: async ({ request, fetch, cookies, locals }) => {
		const form = await request.formData();
		const nom_ferme = champ(form, 'nom_ferme');
		const adresse_siege = champ(form, 'adresse_siege');
		const type_produit = champ(form, 'type_produit');

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
		const res = await setSupplierActive(
			fetch,
			cookies,
			champ(form, 'id'),
			champ(form, 'active') === 'true'
		);
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
		const res = await setLocationActive(
			fetch,
			cookies,
			champ(form, 'id'),
			champ(form, 'active') === 'true'
		);
		if (!res.ok) return fail(res.status, { locationError: res.message });
		return { locationToggled: res.data };
	},

	createCustomer: async ({ request, fetch, cookies, locals }) => {
		const form = await request.formData();
		const nom_enseigne = champ(form, 'nom_enseigne');
		const adresse_livraison = champ(form, 'adresse_livraison');
		const email = champ(form, 'email');

		const refus = refusAdministration(locals.user);
		if (refus) return fail(403, { customerError: refus, nom_enseigne });
		if (nom_enseigne.length < 2 || adresse_livraison.length < 2) {
			return fail(400, {
				customerError: 'Enseigne et adresse de livraison requises.',
				nom_enseigne
			});
		}

		const res = await createCustomer(fetch, cookies, {
			nom_enseigne,
			adresse_livraison,
			...(email ? { email } : {})
		});
		if (!res.ok) return fail(res.status, { customerError: res.message, nom_enseigne });
		return { customerCreated: res.data };
	},

	toggleCustomer: async ({ request, fetch, cookies, locals }) => {
		const refus = refusAdministration(locals.user);
		if (refus) return fail(403, { customerError: refus });
		const form = await request.formData();
		const res = await setCustomerActive(
			fetch,
			cookies,
			champ(form, 'id'),
			champ(form, 'active') === 'true'
		);
		if (!res.ok) return fail(res.status, { customerError: res.message });
		return { customerToggled: res.data };
	},

	createProduct: async ({ request, fetch, cookies, locals }) => {
		const form = await request.formData();
		const nom = champ(form, 'nom');
		const code_gtin = champ(form, 'code_gtin');
		const categorie = champ(form, 'categorie');
		const duree_conservation_defaut = nombre(form, 'duree_conservation_defaut');
		const seuil_alerte_stock = nombre(form, 'seuil_alerte_stock');
		const unite_reference = champ(form, 'unite_reference');

		const refus = refusAdministration(locals.user);
		if (refus) return fail(403, { productError: refus, nom });
		if (
			nom.length < 2 ||
			!/^\d{8,14}$/.test(code_gtin) ||
			categorie.length < 2 ||
			!Number.isFinite(duree_conservation_defaut) ||
			!Number.isFinite(seuil_alerte_stock) ||
			unite_reference.length < 1
		) {
			return fail(400, {
				productError: 'Tous les champs sont requis (GTIN à 8-14 chiffres).',
				nom
			});
		}

		const res = await createProduct(fetch, cookies, {
			nom,
			code_gtin,
			categorie,
			duree_conservation_defaut,
			seuil_alerte_stock,
			unite_reference
		});
		if (!res.ok) return fail(res.status, { productError: res.message, nom });
		return { productCreated: res.data };
	},

	toggleProduct: async ({ request, fetch, cookies, locals }) => {
		const refus = refusAdministration(locals.user);
		if (refus) return fail(403, { productError: refus });
		const form = await request.formData();
		const res = await setProductActive(
			fetch,
			cookies,
			champ(form, 'id'),
			champ(form, 'active') === 'true'
		);
		if (!res.ok) return fail(res.status, { productError: res.message });
		return { productToggled: res.data };
	}
} satisfies Actions;
