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
