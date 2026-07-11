import type { Pathname } from '$app/types';

export type Kpi = {
	label: string;
	value: string;
	detail: string;
};

export type EpcisEvent = {
	when: string;
	title: string;
	meta: string;
};

export type TaskItem = {
	variant: 'info' | 'warn';
	text: string;
	link?: { href: Pathname; label: string };
};

export const kpis: Kpi[] = [
	{ label: 'Lots suivis (30 j)', value: '12 847', detail: '+4,2 % vs. période précédente' },
	{ label: 'Alertes chaîne du froid', value: '3', detail: '2 en investigation' },
	{ label: 'Rappels en cours', value: '1', detail: 'Yaourt bio — lot ciblé' },
	{ label: 'Anomalies ouvertes', value: '7', detail: '3 quarantaine active' },
	{ label: 'Sync. intégrations', value: '99 %', detail: 'Dernier flux WMS il y a 2 min' }
];

export const recentEvents: EpcisEvent[] = [
	{
		when: "Aujourd'hui — 14:32",
		title: 'ObjectEvent — réception',
		meta: 'SSCC 00376123456789012345 · Site Bretagne Nord'
	},
	{
		when: "Aujourd'hui — 11:08",
		title: 'AggregationEvent — palette',
		meta: 'SSCC 00376123456789012999 · Entrepôt Rennes'
	},
	{
		when: 'Hier — 18:45',
		title: 'TransactionEvent — expédition',
		meta: 'Lot LOT-2025-8842 · Client Carrefour Ouest'
	}
];

export const tasks: TaskItem[] = [
	{
		variant: 'info',
		text: 'Validation qualité — 5 bons de réception en attente de visa.'
	},
	{
		variant: 'warn',
		text: 'Rappel RAP-2025-014 — retrait magasin à 78 %',
		link: { href: '/rappels-produits', label: 'voir le suivi' }
	}
];
