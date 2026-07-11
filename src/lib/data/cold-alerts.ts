import type { ColdAlertRow, ColdIncident } from '$lib/types/cold';

export const coldIncident: ColdIncident = {
	id: 'COLD-2025-089',
	message: 'Dépassement > 8 °C sur ligne expédition Loire — équipe terrain notifiée.'
};

export const coldAlerts: ColdAlertRow[] = [
	{
		id: 'COLD-889',
		site: 'Loire',
		zone: 'Quai B',
		tempMax: '9,2 °C',
		depuis: '42 min',
		statut: 'critique'
	},
	{
		id: 'COLD-888',
		site: 'RDC IDF',
		zone: 'Ch. froide 3',
		tempMax: '6,8 °C',
		depuis: '2 h',
		statut: 'investigation'
	}
];
