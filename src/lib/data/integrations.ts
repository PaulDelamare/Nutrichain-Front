import type { Connector } from '$lib/types/integration';

export const connectors: Connector[] = [
	{
		name: 'SAP S/4HANA',
		statut: 'ok',
		lines: ['Flux articles & lots — delta toutes les 15 min', 'Dernière synchro : il y a 3 min']
	},
	{
		name: 'WMS Reflex',
		statut: 'ok',
		lines: ['Mouvements & SSCC en temps quasi réel']
	},
	{
		name: 'TMS',
		statut: 'latence',
		lines: ["2 expéditions en file d'attente"]
	}
];
