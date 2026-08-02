import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createReceipt, getReceipts } from '$lib/Api/logistics.server';
import { getEquipment, getProductsForConfig, getSuppliers } from '$lib/Api/organization.server';
import { refusEcriture } from '$lib/server/guards';

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
	const page = parsePage(p.get('page'));
	const limit = parseLimit(p.get('limit'));
	// Filtres de colonnes portés par l'URL : la requête part filtrée à l'API (plus de tri sur la
	// seule page reçue), et un lien filtré reste partageable / rechargeable.
	const ref = p.get('ref')?.trim() || undefined;
	const fournisseur = p.get('fournisseur')?.trim() || undefined;
	const statut = p.get('statut')?.trim() || undefined;
	const date = p.get('date')?.trim() || undefined;

	const [receipts, suppliers, products, equipment] = await Promise.all([
		getReceipts(fetch, cookies, { page, limit, ref, fournisseur, statut, date }),
		getSuppliers(fetch, cookies),
		getProductsForConfig(fetch, cookies),
		getEquipment(fetch, cookies)
	]);

	// Valeurs courantes des filtres, remises dans la forme du panneau (sentinelle `tous` pour les selects).
	const filters = {
		ref: ref ?? '',
		fournisseur: fournisseur ?? 'tous',
		statut: statut ?? 'tous',
		date: date ?? ''
	};

	const meta = { filters, pageSize: limit, pageSizeOptions: [...PAGE_SIZE_OPTIONS] };

	if (!receipts.ok) {
		return {
			receipts: [],
			pagination: { ...emptyPagination, limit },
			error: receipts.message,
			suppliers: [],
			products: [],
			equipment: [],
			...meta
		};
	}

	return {
		receipts: receipts.data.data.map((r) => ({
			id: r.id,
			shipmentId: r.shipment_id,
			fournisseur: r.fournisseur?.nom_ferme ?? '—',
			statut: r.statut_controle,
			date: new Date(r.date_reception).toLocaleString('fr-FR')
		})),
		pagination: receipts.data.pagination,
		error: null,
		// Aucun refiltrage sur `is_active` : l'API l'applique déjà dans son `where`, et sa projection
		// pour un rôle terrain ne contient même pas le champ — le filtre vidait donc le sélecteur
		// Fournisseur pour tout compte non administrateur (#82).
		suppliers: suppliers.ok ? suppliers.data : [],
		products: products.ok ? products.data : [],
		// Le matériel, lui, n'est PAS filtré par l'API : écarter les frigos en panne est une règle
		// métier du front, pas une redondance.
		equipment: equipment.ok ? equipment.data.filter((e) => e.statut !== 'HORS_SERVICE') : [],
		...meta
	};
};

export const actions = {
	create: async ({ request, fetch, cookies, locals }) => {
		const refus = refusEcriture(locals.user);
		if (refus) return fail(403, { createError: refus });

		const fd = await request.formData();
		const id_fournisseur = String(fd.get('id_fournisseur') ?? '').trim();
		const shipment_id = String(fd.get('shipment_id') ?? '').trim();
		const id_produit = String(fd.get('id_produit') ?? '').trim();
		const quantite_actuelle = Number(String(fd.get('quantite_actuelle') ?? '').replace(',', '.'));
		const unite_code = String(fd.get('unite_code') ?? '')
			.trim()
			.toUpperCase();
		const statut_controle = String(fd.get('statut_controle') ?? '').trim() as
			| 'OK'
			| 'ALERTE'
			| 'NONCONFORME';
		const id_materiel = String(fd.get('id_materiel') ?? '').trim();
		const lot_number = String(fd.get('lot_number') ?? '').trim();
		const date_peremption = String(fd.get('date_peremption') ?? '').trim();

		if (
			!id_fournisseur ||
			shipment_id.length < 3 ||
			!id_produit ||
			!(quantite_actuelle > 0) ||
			!unite_code ||
			!['OK', 'ALERTE', 'NONCONFORME'].includes(statut_controle)
		) {
			return fail(400, {
				createError: 'Fournisseur, BL (≥3 car.), produit, quantité et contrôle sont requis.'
			});
		}

		const res = await createReceipt(fetch, cookies, {
			id_fournisseur,
			shipment_id,
			id_produit,
			quantite_actuelle,
			unite_code,
			statut_controle,
			...(id_materiel ? { id_materiel } : {}),
			...(lot_number ? { lot_number } : {}),
			...(date_peremption ? { date_peremption } : {})
		});

		if (!res.ok) return fail(res.status, { createError: res.message });
		return { created: res.data };
	}
} satisfies Actions;
