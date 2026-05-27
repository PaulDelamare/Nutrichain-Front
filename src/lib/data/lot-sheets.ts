import type { LotSheet } from '$lib/types/lot-sheet';
import { lots } from '$lib/data/lot-search';

const sheets: Record<string, LotSheet> = {
	'L-2025-08912': {
		id: 'L-2025-08912',
		produit: 'Yaourt nature bio 4x125g',
		gtin: '3560078891234',
		dlc: '12/04/2025',
		quantite: '2 400 unités',
		statut: 'conforme',
		statutRaw: 'EN STOCK',
		temperature: '3,8 °C',
		createdBy: '—',
		events: [
			{
				time: '14:32',
				day: 'Aujourd\'hui',
				title: 'Mesure IoT +3,8 °C',
				detail: 'Chambre froide B — seuil OK'
			},
			{
				time: '09:10',
				title: 'ObjectEvent — stockage',
				detail: 'EPCIS bizStep : storing · GLN 3776123456789'
			}
		],
		site: 'Bretagne Nord',
		zone: 'Zone F — Allée 12 — Niveau 2',
		wmsSync: 'il y a 4 min'
	}
};

for (const lot of lots) {
	if (sheets[lot.id]) continue;

	sheets[lot.id] = {
		id: lot.id,
		produit: lot.produit,
		gtin: lot.gtin,
		dlc: '—',
		quantite: '—',
		statut: lot.statut,
		statutRaw: lot.statut,
		temperature: lot.temperature,
		createdBy: '—',
		events: [
			{
				time: '—',
				title: 'Dernière température',
				detail: lot.temperature
			}
		],
		site: lot.site,
		zone: '—',
		wmsSync: '—'
	};
}

export const defaultLotId = 'L-2025-08912';

export function getLotSheet(id: string | null): LotSheet {
	if (id && sheets[id]) return sheets[id];
	return sheets[defaultLotId];
}
