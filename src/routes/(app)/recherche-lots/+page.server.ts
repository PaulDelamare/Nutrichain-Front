import type { PageServerLoad } from './$types';
import { getBatches, getProducts } from '$lib/Api/traceability.server';
import { getEquipment, getLocations } from '$lib/Api/organization.server';
import { batchToRow } from '$lib/utils/lots/mapBatch';

/** Tailles proposées par le sélecteur d'affichage. La pagination se recompose sur la taille choisie. */
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 25;

const emptyPagination = { page: 1, limit: DEFAULT_PAGE_SIZE, total: 0, totalPages: 0 };

/** Une page hors bornes (`?page=0`, `?page=abc`) est un lien copié de travers, pas une erreur 400. */
function parsePage(raw: string | null): number {
	const parsed = Number(raw);
	return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
}

/** `limit` est borné à la liste du sélecteur : un `?limit=999` copié retombe sur le défaut. */
function parseLimit(raw: string | null): number {
	const parsed = Number(raw);
	return (PAGE_SIZE_OPTIONS as readonly number[]).includes(parsed) ? parsed : DEFAULT_PAGE_SIZE;
}

export const load: PageServerLoad = async ({ fetch, cookies, url }) => {
	const p = url.searchParams;
	const search = p.get('q')?.trim() || undefined;
	const page = parsePage(p.get('page'));
	const limit = parseLimit(p.get('limit'));
	// Les filtres de colonnes voyagent dans l'URL : la requête part filtrée à l'API (plus de tri sur
	// la seule page reçue), et un lien filtré reste partageable / rechargeable.
	const statut = p.get('statut')?.trim() || undefined;
	const produit = p.get('produit')?.trim() || undefined;
	const site = p.get('site')?.trim() || undefined;
	const lot = p.get('lot')?.trim() || undefined;
	const gtin = p.get('gtin')?.trim() || undefined;

	const [res, equipment, products, locations] = await Promise.all([
		getBatches(fetch, cookies, { search, page, limit, statut, produit, site, lot, gtin }),
		getEquipment(fetch, cookies),
		getProducts(fetch, cookies),
		getLocations(fetch, cookies)
	]);

	// Options des selects : elles couvrent TOUTE l'organisation (produits / lieux), pas la page reçue —
	// sinon un filtre pertinent manquerait dès qu'aucun lot de la page ne le porte.
	// L'API ne renvoie déjà que l'actif (produits / lieux non archivés) : on ne re-trie pas sur
	// is_active côté front (#82).
	const produitOptions = products.ok
		? products.data.map((x) => ({ label: x.nom, value: x.id }))
		: [];
	const siteOptions = locations.ok
		? locations.data.map((l) => ({ label: l.nom, value: l.id }))
		: [];

	// Valeurs courantes, remises dans la forme du panneau de filtres (sentinelle `tous` pour les selects).
	const filters = {
		gtin: gtin ?? '',
		lot: lot ?? '',
		produit: produit ?? 'tous',
		site: site ?? 'tous',
		statut: statut ?? 'tous'
	};

	if (!res.ok) {
		return {
			lots: [],
			error: res.message,
			searchQuery: search ?? '',
			pagination: { ...emptyPagination, limit },
			pageSize: limit,
			pageSizeOptions: [...PAGE_SIZE_OPTIONS],
			filters,
			produitOptions,
			siteOptions
		};
	}

	const tempByEquipment = new Map<string, string | number | null>();
	if (equipment.ok) {
		for (const e of equipment.data) {
			tempByEquipment.set(e.id, e.temp_actuelle);
		}
	}

	return {
		lots: res.data.data.map((b) => batchToRow(b, tempByEquipment)),
		searchQuery: search ?? '',
		pagination: res.data.pagination,
		pageSize: limit,
		pageSizeOptions: [...PAGE_SIZE_OPTIONS],
		filters,
		produitOptions,
		siteOptions
	};
};
