import type { TraceStep } from '$lib/types/trace';

export const traceSteps: TraceStep[] = [
	{
		phase: 'Amont — matière',
		title: 'Lait cru — Ferme Les Aubépines',
		detail: 'Lot MP-2025-441',
		icon: 'amont'
	},
	{
		phase: 'Transformation',
		title: 'Pasteurisation + conditionnement',
		badge: { label: 'HACCP validé', variant: 'green' },
		icon: 'transform'
	},
	{
		phase: 'Aval — produit fini',
		title: 'L-2025-08912 — Yaourt nature bio',
		badge: { label: 'EPCIS Aggregation', variant: 'blue' },
		icon: 'aval'
	}
];
