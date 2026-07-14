import type { PageServerLoad } from './$types';
import { getShipments } from '$lib/Api/organization.server';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const res = await getShipments(fetch, cookies);

	if (!res.ok) {
		return { shipments: [], error: res.message };
	}

	return {
		shipments: res.data.map((s) => ({
			id: s.id,
			ref: s.shipment_id,
			client: s.client?.nom_enseigne ?? '—',
			statut: s.statut_livraison,
			date: new Date(s.date_envoi).toLocaleString('fr-FR'),
			lots: s.liaisons?.map((l) => l.lot.id.slice(0, 8)).join(', ') ?? '—'
		}))
	};
};
