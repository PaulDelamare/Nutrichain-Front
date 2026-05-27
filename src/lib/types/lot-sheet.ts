import type { LotStatus } from '$lib/types/lot';

export type LotEvent = {
	time: string;
	day?: string;
	title: string;
	detail: string;
};

export type LotSheet = {
	id: string;
	produit: string;
	gtin: string;
	dlc: string;
	quantite: string;
	statut: LotStatus;
	statutRaw: string;
	temperature: string;
	createdBy: string;
	events: LotEvent[];
	site: string;
	zone: string;
	wmsSync: string;
};
