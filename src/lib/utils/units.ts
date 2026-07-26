/** Unités acceptées par l’API pour réception / transformation / expédition. */
export const UNIT_OPTIONS = [
	{ code: 'KG', label: 'kg' },
	{ code: 'G', label: 'g' },
	{ code: 'L', label: 'L' },
	{ code: 'ML', label: 'mL' },
	{ code: 'UNIT', label: 'unité' },
	{ code: 'PALLET', label: 'palette' },
	{ code: 'BOX', label: 'carton' }
] as const;
