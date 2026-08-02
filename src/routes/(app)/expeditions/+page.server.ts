import { numeroLot } from '$lib/utils/lots/lotLabel';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { confirmShipmentDelivery, createShipment } from '$lib/Api/logistics.server';
import { getCustomers, getShipments } from '$lib/Api/organization.server';
import { getBatchList } from '$lib/Api/traceability.server';
import { refusEcriture } from '$lib/server/guards';

const EXPEDIABLE = new Set(['EN_STOCK', 'PRET']);

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
	const client = p.get('client')?.trim() || undefined;
	const statut = p.get('statut')?.trim() || undefined;
	const date = p.get('date')?.trim() || undefined;

	const [shipments, customers, batches] = await Promise.all([
		getShipments(fetch, cookies, { page, limit, ref, client, statut, date }),
		getCustomers(fetch, cookies),
		getBatchList(fetch, cookies, { limit: 500 })
	]);

	const filters = {
		ref: ref ?? '',
		client: client ?? 'tous',
		statut: statut ?? 'tous',
		date: date ?? ''
	};
	const meta = { filters, pageSize: limit, pageSizeOptions: [...PAGE_SIZE_OPTIONS] };

	if (!shipments.ok) {
		return {
			shipments: [],
			pagination: { ...emptyPagination, limit },
			error: shipments.message,
			customers: [],
			lots: [],
			...meta
		};
	}

	return {
		shipments: shipments.data.data.map((s) => ({
			id: s.id,
			ref: s.shipment_id,
			client: s.client?.nom_enseigne ?? '—',
			statut: s.statut_livraison,
			date: new Date(s.date_envoi).toLocaleString('fr-FR'),
			// `null` tant que l'arrivée n'a pas été constatée. C'est cette absence, et non le statut
			// seul, qui dit au décideur qu'il ignore où se trouve la marchandise.
			deliveredAt: s.date_livraison ? new Date(s.date_livraison).toLocaleString('fr-FR') : null,
			lots: s.liaisons?.map((l) => l.lot.id.slice(0, 8)).join(', ') ?? '—'
		})),
		pagination: shipments.data.pagination,
		error: null,
		// Pas de refiltrage sur `is_active` : déjà fait par l'API, et absent de la projection servie
		// aux rôles terrain — le sélecteur Client était vide pour eux (#82).
		customers: customers.ok ? customers.data : [],
		lots: batches.ok
			? batches.data
					.filter((b) => EXPEDIABLE.has(b.statut))
					.map((b) => ({
						id: b.id,
						label: `${numeroLot(b)} — ${b.produit?.nom ?? '—'} (${b.quantite_actuelle} ${b.unite_code})`,
						max: Number(b.quantite_actuelle)
					}))
			: [],
		...meta
	};
};

export const actions = {
	create: async ({ request, fetch, cookies, locals }) => {
		const denial = refusEcriture(locals.user);
		if (denial) return fail(403, { createError: denial });

		const fd = await request.formData();
		const id_client = String(fd.get('id_client') ?? '').trim();
		const shipment_id = String(fd.get('shipment_id') ?? '').trim() || 'AUTO';
		const transporteur = String(fd.get('transporteur') ?? '').trim();
		const destination_adresse = String(fd.get('destination_adresse') ?? '').trim();
		const id_lot = String(fd.get('id_lot') ?? '').trim();
		const quantite_expediee = Number(String(fd.get('quantite_expediee') ?? '').replace(',', '.'));

		if (
			!id_client ||
			transporteur.length < 2 ||
			destination_adresse.length < 5 ||
			!id_lot ||
			!(quantite_expediee > 0)
		) {
			return fail(400, {
				createError: 'Client, transporteur, adresse, lot et quantité sont requis.'
			});
		}

		const res = await createShipment(fetch, cookies, {
			id_client,
			shipment_id,
			transporteur,
			destination_adresse,
			lots: [{ id_lot, quantite_expediee }]
		});

		if (!res.ok) return fail(res.status, { createError: res.message });
		return { created: res.data.shipment };
	},

	/**
	 * Constater l'arrivée d'une expédition.
	 *
	 * Même garde d'écriture que la création : c'est un geste de manutention, pas une décision
	 * qualité. L'API le refuse aussi de son côté — cette garde-ci évite juste un aller-retour.
	 */
	confirm: async ({ request, fetch, cookies, locals }) => {
		const denial = refusEcriture(locals.user);
		if (denial) return fail(403, { confirmError: denial });

		const fd = await request.formData();
		const id = String(fd.get('id') ?? '').trim();
		if (!id) return fail(400, { confirmError: 'Expédition inconnue.' });

		const res = await confirmShipmentDelivery(fetch, cookies, id);
		if (!res.ok) return fail(res.status, { confirmError: res.message });

		// Formaté ici comme les dates du tableau : formater dans le gabarit ferait dater la même
		// arrivée du fuseau du navigateur d'un côté et de celui du serveur de l'autre.
		return {
			confirmed: {
				ref: res.data.shipment_id,
				date: new Date(res.data.date_livraison).toLocaleString('fr-FR')
			}
		};
	}
} satisfies Actions;
