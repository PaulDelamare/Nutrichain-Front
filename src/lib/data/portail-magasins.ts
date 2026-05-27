export type StoreStat = {
	label: string;
	value: string;
	accent?: 'warn';
};

export const storeStats: StoreStat[] = [
	{ label: 'Magasins actifs', value: '128' },
	{ label: 'Actions en attente', value: '6', accent: 'warn' }
];

export const activeBrief = {
	title: 'Consigne active',
	text:
		'Retirer du rayon les références listées dans RAP-2025-014 et scanner le code de confirmation dans l\'app terrain.'
};
