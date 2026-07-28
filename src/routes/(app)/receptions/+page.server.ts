import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createReceipt, getReceipts } from '$lib/Api/logistics.server';
import { getEquipment, getProductsForConfig, getSuppliers } from '$lib/Api/organization.server';
import { refusEcriture } from '$lib/server/guards';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const [receipts, suppliers, products, equipment] = await Promise.all([
		getReceipts(fetch, cookies),
		getSuppliers(fetch, cookies),
		getProductsForConfig(fetch, cookies),
		getEquipment(fetch, cookies)
	]);

	if (!receipts.ok) {
		return {
			receipts: [],
			total: 0,
			error: receipts.message,
			suppliers: [],
			products: [],
			equipment: []
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
		total: receipts.data.pagination.total,
		error: null,
		// Aucun refiltrage sur `is_active` : l'API l'applique déjà dans son `where`, et sa projection
		// pour un rôle terrain ne contient même pas le champ — le filtre vidait donc le sélecteur
		// pour tout compte non administrateur (#82).
		suppliers: suppliers.ok ? suppliers.data : [],
		products: products.ok ? products.data : [],
		// Le matériel, lui, n'est PAS filtré par l'API : écarter les frigos en panne est une règle
		// métier du front, pas une redondance.
		equipment: equipment.ok ? equipment.data.filter((e) => e.statut !== 'HORS_SERVICE') : []
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
