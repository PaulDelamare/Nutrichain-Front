import type { NcRow, QuarantineLot } from '$lib/types/nc';

export const openNc: NcRow[] = [
	{ id: 'NC-441', type: 'Étiquetage', statut: 'en_cours' },
	{ id: 'NC-440', type: 'Température', statut: 'quarantaine' }
];

export const quarantineLots: QuarantineLot[] = [
	{
		lot: 'L-2025-08744',
		detail: "blocage stock jusqu'à libération qualité."
	}
];
