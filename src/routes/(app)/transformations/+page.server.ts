import { numeroLot } from '$lib/utils/lots/lotLabel';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getEquipment, getProductsForConfig } from '$lib/Api/organization.server';
import {
	createTransformation,
	getBatchList,
	TRANSFORM_UNITS,
	type TransformUnit
} from '$lib/Api/traceability.server';
import { refusEcriture } from '$lib/server/guards';

const CONSOMMABLE = new Set(['EN_STOCK', 'PRET']);

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const [products, equipment, batches] = await Promise.all([
		getProductsForConfig(fetch, cookies),
		getEquipment(fetch, cookies),
		getBatchList(fetch, cookies, { limit: 500 })
	]);

	return {
		// Même redondance qu'en réception : l'API n'envoie déjà que les produits actifs (#82).
		products: products.ok ? products.data : [],
		equipment: equipment.ok ? equipment.data : [],
		lots: batches.ok
			? batches.data
					.filter((b) => CONSOMMABLE.has(b.statut))
					.map((b) => ({
						id: b.id,
						label: `${numeroLot(b)} — ${b.produit?.nom ?? '—'} (${b.quantite_actuelle} ${b.unite_code})`,
						unite: b.unite_code
					}))
			: [],
		error: products.ok ? null : products.message
	};
};

export const actions = {
	create: async ({ request, fetch, cookies, locals }) => {
		const refus = refusEcriture(locals.user);
		if (refus) return fail(403, { createError: refus });

		const fd = await request.formData();
		const id_produit_fini = String(fd.get('id_produit_fini') ?? '').trim();
		const id_materiel = String(fd.get('id_materiel') ?? '').trim();
		const quantite_produite = Number(String(fd.get('quantite_produite') ?? '').replace(',', '.'));
		const unite_code = String(fd.get('unite_code') ?? '')
			.trim()
			.toUpperCase() as TransformUnit;
		const id_lot_parent = String(fd.get('id_lot_parent') ?? '').trim();
		const quantite_prelevee = Number(String(fd.get('quantite_prelevee') ?? '').replace(',', '.'));
		const unite_input = String(fd.get('unite_input') ?? '')
			.trim()
			.toUpperCase() as TransformUnit;
		const date_peremption = String(fd.get('date_peremption') ?? '').trim();

		if (
			!id_produit_fini ||
			!id_materiel ||
			!(quantite_produite > 0) ||
			!TRANSFORM_UNITS.includes(unite_code) ||
			!id_lot_parent ||
			!(quantite_prelevee > 0) ||
			!TRANSFORM_UNITS.includes(unite_input)
		) {
			return fail(400, {
				createError: 'Produit fini, matériel, quantités et lot parent sont requis.'
			});
		}

		const res = await createTransformation(fetch, cookies, {
			id_produit_fini,
			id_materiel,
			quantite_produite,
			unite_code,
			inputs: [{ id_lot_parent, quantite_prelevee, unite: unite_input }],
			...(date_peremption ? { date_peremption } : {})
		});

		if (!res.ok) return fail(res.status, { createError: res.message });
		return { created: res.data };
	}
} satisfies Actions;
