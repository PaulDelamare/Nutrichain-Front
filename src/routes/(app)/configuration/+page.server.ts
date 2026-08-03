import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	getSuppliersForConfig,
	getLocations,
	getLocationsForConfig,
	getConfigCounts,
	getCustomersForConfig,
	getProductsPaginated,
	getEquipment,
	createSupplier,
	updateSupplier,
	setSupplierActive,
	createLocation,
	updateLocation,
	setLocationActive,
	createCustomer,
	updateCustomer,
	setCustomerActive,
	createProduct,
	updateProduct,
	setProductActive,
	createEquipment
} from '$lib/Api/organization.server';
import type {
	ApiSupplierList,
	ApiCustomerList,
	ApiProductList,
	ApiEquipment,
	ApiLocation
} from '$lib/Api/organization.server';
import { importProductsCsv, importCustomersCsv } from '$lib/Api/connectors.server';
import { exigerAdministrateur, refusAdministration } from '$lib/server/guards';
import { COLD_EQUIPMENT_TYPES, estTypeMateriel } from '$lib/config/equipment';
import { parseCoordinateFields } from '$lib/utils/geo/coordinates';

const TAB_IDS = ['locations', 'suppliers', 'customers', 'products', 'equipment'] as const;
type TabId = (typeof TAB_IDS)[number];
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 25;
const emptyPagination = { page: 1, limit: DEFAULT_PAGE_SIZE, total: 0, totalPages: 0 };

function parseTab(raw: string | null): TabId {
	return (TAB_IDS as readonly string[]).includes(raw ?? '') ? (raw as TabId) : 'locations';
}
function parsePage(raw: string | null): number {
	const n = Number(raw);
	return Number.isInteger(n) && n >= 1 ? n : 1;
}
function parseLimit(raw: string | null): number {
	const n = Number(raw);
	return (PAGE_SIZE_OPTIONS as readonly number[]).includes(n) ? n : DEFAULT_PAGE_SIZE;
}

/**
 * Onglets = navigation URL : le load ne charge QUE l'onglet actif (`?tab=`), paginé/filtré côté
 * API pour les onglets convertis. Les compteurs des badges viennent d'un seul appel dédié. Les
 * onglets pas encore migrés tombent sur leur chemin actuel (tableau complet) quand ils sont actifs.
 */
export const load: PageServerLoad = async ({ fetch, cookies, locals, url }) => {
	exigerAdministrateur(locals.user, "La configuration de l'usine");

	const p = url.searchParams;
	const tab = parseTab(p.get('tab'));
	const page = parsePage(p.get('page'));
	const limit = parseLimit(p.get('limit'));

	const countsRes = await getConfigCounts(fetch, cookies);
	const counts = countsRes.ok
		? countsRes.data
		: { locations: 0, suppliers: 0, customers: 0, products: 0, equipment: 0 };

	// Filtres de l'onglet actif (non préfixés : un seul onglet est actif dans l'URL à la fois).
	const nom = p.get('nom')?.trim() || undefined;
	const statut = p.get('statut')?.trim() || undefined;

	// Défauts : les onglets inactifs sont rendus vides (masqués par le composant Tabs).
	let locations: import('$lib/Api/organization.server').ApiLocationList = {
		data: [],
		pagination: { ...emptyPagination, limit }
	};
	let suppliers: ApiSupplierList = { data: [], pagination: { ...emptyPagination, limit } };
	let customers: ApiCustomerList = { data: [], pagination: { ...emptyPagination, limit } };
	let products: ApiProductList = { data: [], pagination: { ...emptyPagination, limit } };
	let equipment: ApiEquipment[] = [];
	let activeLocations: ApiLocation[] = [];
	let error: string | undefined = countsRes.ok ? undefined : countsRes.message;

	if (tab === 'locations') {
		const res = await getLocationsForConfig(fetch, cookies, {
			page,
			limit,
			nom,
			statut: statut === 'tous' ? undefined : statut
		});
		if (res.ok) locations = res.data;
		else error = res.message;
	} else if (tab === 'suppliers') {
		const res = await getSuppliersForConfig(fetch, cookies, {
			page,
			limit,
			nom,
			statut: statut === 'tous' ? undefined : statut
		});
		if (res.ok) suppliers = res.data;
		else error = res.message;
	} else if (tab === 'customers') {
		const res = await getCustomersForConfig(fetch, cookies, {
			page,
			limit,
			nom,
			statut: statut === 'tous' ? undefined : statut
		});
		if (res.ok) customers = res.data;
		else error = res.message;
	} else if (tab === 'products') {
		const res = await getProductsPaginated(fetch, cookies, {
			page,
			limit,
			nom,
			statut: statut === 'tous' ? undefined : statut
		});
		if (res.ok) products = res.data;
		else error = res.message;
	} else if (tab === 'equipment') {
		const [eq, locs] = await Promise.all([
			getEquipment(fetch, cookies),
			// Liste des emplacements actifs pour le sélecteur de la modale Matériel (non paginé).
			getLocations(fetch, cookies, false)
		]);
		if (eq.ok) equipment = eq.data;
		else error = eq.message;
		if (locs.ok) activeLocations = locs.data;
	}

	return {
		activeTab: tab,
		counts,
		locations,
		locationFilters: { nom: nom ?? '', statut: statut ?? 'tous' },
		// Filtres partagés (mêmes params `nom`/`statut`) : un seul onglet est actif à la fois.
		supplierFilters: { nom: nom ?? '', statut: statut ?? 'tous' },
		customerFilters: { nom: nom ?? '', statut: statut ?? 'tous' },
		productFilters: { nom: nom ?? '', statut: statut ?? 'tous' },
		pageSize: limit,
		pageSizeOptions: [...PAGE_SIZE_OPTIONS],
		suppliers,
		customers,
		products,
		equipment,
		activeLocations,
		error
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
		const contact_qualite = champ(form, 'contact_qualite');

		const refus = refusAdministration(locals.user);
		if (refus) return fail(403, { supplierError: refus, nom_ferme });
		if (nom_ferme.length < 2 || adresse_siege.length < 2) {
			return fail(400, { supplierError: 'Nom et adresse du fournisseur requis.', nom_ferme });
		}

		const res = await createSupplier(fetch, cookies, {
			nom_ferme,
			adresse_siege,
			...(type_produit ? { type_produit } : {}),
			...(contact_qualite ? { contact_qualite } : {})
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

	updateSupplier: async ({ request, fetch, cookies, locals }) => {
		const form = await request.formData();
		const id = champ(form, 'id');
		const nom_ferme = champ(form, 'nom_ferme');
		const adresse_siege = champ(form, 'adresse_siege');
		const type_produit = champ(form, 'type_produit');
		const contact_qualite = champ(form, 'contact_qualite');

		const refus = refusAdministration(locals.user);
		if (refus) return fail(403, { supplierError: refus, nom_ferme });
		if (!id || nom_ferme.length < 2 || adresse_siege.length < 2) {
			return fail(400, {
				supplierError: 'Identifiant, nom et adresse du fournisseur requis.',
				nom_ferme
			});
		}

		const res = await updateSupplier(fetch, cookies, id, {
			nom_ferme,
			adresse_siege,
			...(type_produit ? { type_produit } : {}),
			...(contact_qualite ? { contact_qualite } : {})
		});
		if (!res.ok) return fail(res.status, { supplierError: res.message, nom_ferme });
		return { supplierUpdated: res.data };
	},

	// `type` est facultatif (simple label), la position se saisit ICI (plus de formulaire séparé) et
	// reste la SEULE source du repère affiché sur la fiche lot (#23).
	createLocation: async ({ request, fetch, cookies, locals }) => {
		const refus = refusAdministration(locals.user);
		const form = await request.formData();
		const nom = champ(form, 'nom');
		if (refus) return fail(403, { locationError: refus, nom });
		if (nom.length < 2) {
			return fail(400, { locationError: "Nom de l'emplacement requis (2 caractères min).", nom });
		}

		const coords = parseCoordinateFields(champ(form, 'latitude'), champ(form, 'longitude'));
		if (!coords.ok) return fail(400, { locationError: coords.message, nom });

		const type = champ(form, 'type');
		const description = champ(form, 'description');

		const res = await createLocation(fetch, cookies, {
			nom,
			...(type ? { type } : {}),
			...(description ? { description } : {}),
			...(coords.latitude != null && coords.longitude != null
				? { latitude: coords.latitude, longitude: coords.longitude }
				: {})
		});
		if (!res.ok) return fail(res.status, { locationError: res.message, nom });
		return { locationCreated: res.data };
	},

	// Édition complète d'un emplacement (nom, type, description, position) via la modale. Les champs
	// vides EFFACENT (type/description → null ; les deux coordonnées vides → position retirée).
	updateLocation: async ({ request, fetch, cookies, locals }) => {
		const refus = refusAdministration(locals.user);
		if (refus) return fail(403, { locationError: refus });

		const form = await request.formData();
		const id = champ(form, 'id');
		if (!id) return fail(400, { locationError: 'Emplacement à modifier requis.' });

		const nom = champ(form, 'nom');
		if (nom.length < 2) {
			return fail(400, { locationError: "Nom de l'emplacement requis (2 caractères min).", nom });
		}

		const coords = parseCoordinateFields(champ(form, 'latitude'), champ(form, 'longitude'));
		if (!coords.ok) return fail(400, { locationError: coords.message, nom });

		const type = champ(form, 'type');
		const description = champ(form, 'description');

		const res = await updateLocation(fetch, cookies, id, {
			nom,
			type: type || null,
			description: description || null,
			latitude: coords.latitude,
			longitude: coords.longitude
		});
		if (!res.ok) return fail(res.status, { locationError: res.message, nom });
		return { locationUpdated: res.data };
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
		const contact_urgence = champ(form, 'contact_urgence');
		const notes = champ(form, 'notes');

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
			...(email ? { email } : {}),
			...(contact_urgence ? { contact_urgence } : {}),
			...(notes ? { notes } : {})
		});
		if (!res.ok) return fail(res.status, { customerError: res.message, nom_enseigne });
		return { customerCreated: res.data };
	},

	updateCustomer: async ({ request, fetch, cookies, locals }) => {
		const form = await request.formData();
		const id = champ(form, 'id');
		const nom_enseigne = champ(form, 'nom_enseigne');
		const adresse_livraison = champ(form, 'adresse_livraison');
		const email = champ(form, 'email');
		const contact_urgence = champ(form, 'contact_urgence');
		const notes = champ(form, 'notes');

		const refus = refusAdministration(locals.user);
		if (refus) return fail(403, { customerError: refus, nom_enseigne });
		if (!id || nom_enseigne.length < 2 || adresse_livraison.length < 2) {
			return fail(400, {
				customerError: 'Identifiant, enseigne et adresse de livraison requis.',
				nom_enseigne
			});
		}

		// Champs facultatifs vides ⇒ on les EFFACE (null), comme la modale le laisse entendre.
		const res = await updateCustomer(fetch, cookies, id, {
			nom_enseigne,
			adresse_livraison,
			email: email || null,
			contact_urgence: contact_urgence || null,
			notes: notes || null
		});
		if (!res.ok) return fail(res.status, { customerError: res.message, nom_enseigne });
		return { customerUpdated: res.data };
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

	updateProduct: async ({ request, fetch, cookies, locals }) => {
		const form = await request.formData();
		const id = champ(form, 'id');
		const nom = champ(form, 'nom');
		const categorie = champ(form, 'categorie');
		const duree_conservation_defaut = nombre(form, 'duree_conservation_defaut');
		const seuil_alerte_stock = nombre(form, 'seuil_alerte_stock');

		const refus = refusAdministration(locals.user);
		if (refus) return fail(403, { productError: refus, nom });
		// Le GTIN et l'unité ne sont PAS éditables (identité GS1) : la modale ne les propose pas.
		if (
			!id ||
			nom.length < 2 ||
			categorie.length < 2 ||
			!Number.isFinite(duree_conservation_defaut) ||
			!Number.isFinite(seuil_alerte_stock)
		) {
			return fail(400, { productError: 'Nom, catégorie, conservation et seuil requis.', nom });
		}

		const res = await updateProduct(fetch, cookies, id, {
			nom,
			categorie,
			duree_conservation_defaut,
			seuil_alerte_stock
		});
		if (!res.ok) return fail(res.status, { productError: res.message, nom });
		return { productUpdated: res.data };
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
	},

	createEquipment: async ({ request, fetch, cookies, locals }) => {
		const form = await request.formData();
		const nom = champ(form, 'nom');
		const type = champ(form, 'type');
		const id_lieu = champ(form, 'id_lieu');
		const tempRaw = champ(form, 'temp_seuil_max');
		const sensor_id = champ(form, 'sensor_id');

		const refus = refusAdministration(locals.user);
		if (refus) return fail(403, { equipmentError: refus, nom });
		if (nom.length < 3 || !estTypeMateriel(type) || !id_lieu) {
			return fail(400, { equipmentError: 'Nom (3 caractères), type et emplacement requis.', nom });
		}

		const temp_seuil_max = tempRaw === '' ? undefined : Number(tempRaw);
		if (temp_seuil_max !== undefined && !Number.isFinite(temp_seuil_max)) {
			return fail(400, { equipmentError: 'Seuil de température invalide.', nom });
		}
		if (
			COLD_EQUIPMENT_TYPES.includes(type) &&
			(temp_seuil_max == null || !Number.isFinite(temp_seuil_max))
		) {
			return fail(400, {
				equipmentError: 'Seuil de température requis pour un frigo ou congélateur.',
				nom
			});
		}

		const res = await createEquipment(fetch, cookies, {
			nom,
			type,
			id_lieu,
			...(temp_seuil_max !== undefined ? { temp_seuil_max } : {}),
			...(sensor_id ? { sensor_id } : {})
		});
		if (!res.ok) return fail(res.status, { equipmentError: res.message, nom });
		return { equipmentCreated: res.data };
	},

	importProducts: async ({ request, fetch, cookies, locals }) => {
		const refus = refusAdministration(locals.user);
		if (refus) return fail(403, { importKind: 'products' as const, importError: refus });

		const csv = await lireCsv(await request.formData());
		if (csv === null) {
			return fail(400, { importKind: 'products' as const, importError: 'Fichier CSV requis.' });
		}

		const res = await importProductsCsv(fetch, cookies, csv);
		if (!res.ok) {
			return fail(res.status, { importKind: 'products' as const, importError: res.message });
		}
		return { importKind: 'products' as const, importReport: res.data };
	},

	importCustomers: async ({ request, fetch, cookies, locals }) => {
		const refus = refusAdministration(locals.user);
		if (refus) return fail(403, { importKind: 'customers' as const, importError: refus });

		const csv = await lireCsv(await request.formData());
		if (csv === null) {
			return fail(400, { importKind: 'customers' as const, importError: 'Fichier CSV requis.' });
		}

		const res = await importCustomersCsv(fetch, cookies, csv);
		if (!res.ok) {
			return fail(res.status, { importKind: 'customers' as const, importError: res.message });
		}
		return { importKind: 'customers' as const, importReport: res.data };
	}
} satisfies Actions;

// Lit le fichier CSV uploadé et renvoie son texte, ou null si absent/vide.
async function lireCsv(form: FormData): Promise<string | null> {
	const file = form.get('file');
	if (!(file instanceof File) || file.size === 0) return null;
	const text = (await file.text()).trim();
	return text.length > 0 ? text : null;
}
