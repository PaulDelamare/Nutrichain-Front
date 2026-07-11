import type { LotRow } from '$lib/types/lot';

export const lotSiteOptions = [
	{ label: 'Tous', value: 'tous' },
	{ label: 'Bretagne Nord', value: 'bretagne nord' },
	{ label: 'RDC IDF', value: 'rdc idf' },
	{ label: 'Loire', value: 'loire' }
] as const;

export const lotStatutOptions = [
	{ label: 'Tous', value: 'tous' },
	{ label: 'Conforme', value: 'conforme' },
	{ label: 'Surveillance', value: 'surveillance' },
	{ label: 'Quarantaine', value: 'quarantaine' }
] as const;

export const lots: LotRow[] = [
	{
		id: 'L-2025-08912',
		produit: 'Yaourt nature bio 4x125g',
		gtin: '3560078891234',
		sscc: '00376123456789012345',
		site: 'Bretagne Nord',
		statut: 'conforme',
		temperature: '3,8 °C'
	},
	{
		id: 'L-2025-08801',
		produit: 'Emmental tranché',
		gtin: '3560078456789',
		sscc: '00376123456789012999',
		site: 'RDC IDF',
		statut: 'surveillance',
		temperature: '5,1 °C'
	},
	{
		id: 'L-2025-08744',
		produit: 'Salade barquette',
		gtin: '3560078123456',
		sscc: '00376123456789012001',
		site: 'Loire',
		statut: 'quarantaine',
		temperature: '9,2 °C'
	}
];
