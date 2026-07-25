import type { PageServerLoad } from './$types';
import { getReceipts } from '$lib/Api/logistics.server';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const res = await getReceipts(fetch, cookies);

	if (!res.ok) {
		return { receipts: [], total: 0, error: res.message };
	}

	return {
		receipts: res.data.data.map((r) => ({
			id: r.id,
			shipmentId: r.shipment_id,
			fournisseur: r.fournisseur?.nom_ferme ?? '—',
			statut: r.statut_controle,
			date: new Date(r.date_reception).toLocaleString('fr-FR')
		})),
		total: res.data.pagination.total
	};
};
