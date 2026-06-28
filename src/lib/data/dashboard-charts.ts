import type { DashboardCharts } from '$lib/types/dashboard-charts';

export const mockDashboardCharts: DashboardCharts = {
	lotStatus: [
		{ label: 'En stock', value: 842, color: '#1b6b5c' },
		{ label: 'Surveillance', value: 124, color: '#5aafa0' },
		{ label: 'Quarantaine', value: 18, color: '#f59e0b' },
		{ label: 'Bloqué', value: 6, color: '#ef4444' }
	],
	weeklyMovements: {
		labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
		series: [
			{
				name: 'Réceptions',
				color: '#1b6b5c',
				data: [42, 38, 55, 48, 61, 12, 8]
			},
			{
				name: 'Expéditions',
				color: '#5aafa0',
				data: [35, 40, 32, 44, 52, 18, 6]
			},
			{
				name: 'Quarantaines',
				color: '#f59e0b',
				data: [2, 1, 3, 0, 2, 0, 1]
			}
		]
	},
	alertSeverity: [
		{ label: 'Critique', value: 2, color: '#ef4444' },
		{ label: 'Haute', value: 1, color: '#f59e0b' },
		{ label: 'Moyenne', value: 3, color: '#5aafa0' },
		{ label: 'Faible', value: 1, color: '#94a3b8' }
	],
	qualityResults: [
		{ label: 'Conforme', value: 94, color: '#1b6b5c' },
		{ label: 'En cours', value: 4, color: '#5aafa0' },
		{ label: 'Non conforme', value: 2, color: '#ef4444' }
	]
};
