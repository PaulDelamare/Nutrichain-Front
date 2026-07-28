import { numeroLot } from '$lib/utils/lots/lotLabel';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createShipment } from '$lib/Api/logistics.server';
import { getCustomers, getShipments } from '$lib/Api/organization.server';
import { getBatchList } from '$lib/Api/traceability.server';
import { refusEcriture } from '$lib/server/guards';

const EXPEDIABLE = new Set(['EN_STOCK', 'PRET']);

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const [shipments, customers, batches] = await Promise.all([
		getShipments(fetch, cookies),
		getCustomers(fetch, cookies),
		getBatchList(fetch, cookies, { limit: 500 })
	]);

	if (!shipments.ok) {
		return {
			shipments: [],
			error: shipments.message,
			customers: [],
			lots: []
		};
	}

	return {
		shipments: shipments.data.map((s) => ({
			id: s.id,
			ref: s.shipment_id,
			client: s.client?.nom_enseigne ?? '—',
			statut: s.statut_livraison,
			date: new Date(s.date_envoi).toLocaleString('fr-FR'),
			lots: s.liaisons?.map((l) => l.lot.id.slice(0, 8)).join(', ') ?? '—'
		})),
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
			: []
	};
};

export const actions = {
	create: async ({ request, fetch, cookies, locals }) => {
		const refus = refusEcriture(locals.user);
		if (refus) return fail(403, { createError: refus });

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
	}
} satisfies Actions;
