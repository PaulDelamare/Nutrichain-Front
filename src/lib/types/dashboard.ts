import type { Pathname } from '$app/types';

export type KpiAccent = 'green' | 'red' | 'blue' | 'orange';

export type Kpi = {
	label: string;
	value: string;
	detail: string;
	href: Pathname;
	accent: KpiAccent;
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
