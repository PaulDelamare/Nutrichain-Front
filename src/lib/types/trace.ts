export type TraceBadge = {
	label: string;
	variant: 'green' | 'blue';
};

export type TraceIcon = 'amont' | 'transform' | 'aval';

export type TraceStep = {
	phase: string;
	title: string;
	detail?: string;
	badge?: TraceBadge;
	icon: TraceIcon;
};

export type TraceGraph = {
	upstream: TraceStep[];
	selected: TraceStep;
	downstream: TraceStep[];
};
